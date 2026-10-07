#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(args) {
  const parsed = { profile: "free_coding", prompt: "", files: [], reasoningEffort: "low", maxTokens: 4096 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--profile") parsed.profile = args[++i];
    else if (args[i] === "--prompt") parsed.prompt = args[++i];
    else if (args[i] === "--effort") parsed.reasoningEffort = args[++i];
    else if (args[i] === "--max-tokens") parsed.maxTokens = parseInt(args[++i], 10);
    else if (args[i] === "--files") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        parsed.files.push(args[++i]);
      }
    }
  }
  return parsed;
}

function loadConfig() {
  const resolvedPath = join(repoRoot, ".agents/nararouter/models.json");
  const examplePath = join(repoRoot, ".agents/nararouter/models.example.json");
  const path = existsSync(resolvedPath) ? resolvedPath : examplePath;
  if (!existsSync(path)) throw new Error("No NaraRouter configuration found in .agents/nararouter/");
  return JSON.parse(readFileSync(path, "utf8"));
}

async function main() {
  if (!process.env.NARAROUTER_API_KEY) {
    try {
      process.loadEnvFile(join(repoRoot, ".env"));
    } catch {}
  }
  const apiKey = process.env.NARAROUTER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error("[nararouter-client] ERROR: NARAROUTER_API_KEY environment variable is required.");
    process.exit(1);
  }

  const { profile, prompt, files, reasoningEffort, maxTokens } = parseArgs(process.argv.slice(2));
  if (!prompt) {
    console.error("[nararouter-client] ERROR: --prompt is required.");
    process.exit(1);
  }

  const config = loadConfig();
  const profileConfig = config.profiles?.[profile];
  if (!profileConfig) {
    console.error(`[nararouter-client] ERROR: Profile '${profile}' not found in routing configuration.`);
    process.exit(1);
  }

  let modelId = profileConfig.nararouter_model_id;

  if (profileConfig.strategy === "roundRobin") {
    const cycleFile = join(repoRoot, ".agents/nararouter/.cycle_index");
    let cycleIndex = 0;
    try {
      if (existsSync(cycleFile)) cycleIndex = parseInt(readFileSync(cycleFile, "utf8"), 10) || 0;
    } catch {}

    const members = profileConfig.members || [];
    if (members.length > 0) {
      const selectedMember = members[cycleIndex % members.length];
      console.log(`[nararouter-client] Round-robin selected member [${cycleIndex % members.length}]: ${selectedMember}`);
      // Save next sticky index (sticky limit 1: next request moves to subsequent host)
      try {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(cycleFile, String((cycleIndex + 1) % members.length), "utf8");
      } catch {}
      modelId = selectedMember;
    } else {
      modelId = profileConfig.fallback;
    }
  }

  if (!modelId || modelId.startsWith("<")) {
    if (profileConfig.fallback) {
      console.warn(`[nararouter-client] Member model unresolved (${modelId}); falling back to: ${profileConfig.fallback}`);
      modelId = profileConfig.fallback;
    } else {
      console.error(`[nararouter-client] ERROR: Unresolved model ID for profile '${profile}': ${modelId}. Run /v1/models check first.`);
      process.exit(1);
    }
  }

  if (profileConfig.requires_cost_approval && process.env.NARAROUTER_COST_APPROVED !== "1") {
    console.error(`[nararouter-client] ERROR: Profile '${profile}' requires explicit cost approval (set NARAROUTER_COST_APPROVED=1).`);
    process.exit(1);
  }

  let fileContext = "";
  for (const f of files) {
    const fullPath = resolve(repoRoot, f);
    if (existsSync(fullPath)) {
      fileContext += `\n\n--- File: ${f} ---\n` + readFileSync(fullPath, "utf8");
    }
  }

  const fullPrompt = fileContext ? `${prompt}\n\nRelevant Context:${fileContext}` : prompt;

  const url = `${config.base_url.replace(/\/+$/, "")}/chat/completions`;
  const body = {
    model: modelId,
    messages: [{ role: "user", content: fullPrompt }],
    max_tokens: maxTokens,
    reasoning_effort: profileConfig.reasoning_effort || reasoningEffort,
  };

  const candidates = profileConfig.strategy === "roundRobin"
    ? [modelId, ...((profileConfig.members || []).filter(m => m !== modelId)), profileConfig.fallback].filter(Boolean)
    : [modelId];

  let response;
  let activeModel = modelId;

  for (const candidate of candidates) {
    activeModel = candidate;
    body.model = candidate;
    let failed = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) break;
        if (response.status >= 500 && attempt < 3) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        if (response.status === 404 || response.status === 400) {
          console.warn(`[nararouter-client] Member '${candidate}' returned HTTP ${response.status}; escalating to next candidate.`);
          failed = true;
          break;
        }
        console.error(`[nararouter-client] HTTP Error ${response.status}: request failed closed.`);
        process.exit(1);
      } catch (e) {
        failed = true;
        break;
      }
    }

    if (response && response.ok) break;
  }

  if (!response || !response.ok) {
    console.error(`[nararouter-client] All candidates failed; request failed closed.`);
    process.exit(1);
  }

  const json = await response.json();
  const choice = json.choices?.[0]?.message?.content ?? "";
  const usage = json.usage ?? {};

  console.log(`[nararouter-client] Model: ${activeModel} | Prompt tokens: ${usage.prompt_tokens ?? "N/A"} | Completion tokens: ${usage.completion_tokens ?? "N/A"}`);
  console.log("\n" + choice);
}

main().catch((err) => {
  console.error(`[nararouter-client] ERROR: ${err.message}`);
  process.exit(1);
});
