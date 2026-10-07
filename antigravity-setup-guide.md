# Antigravity setup brief for ElizaOS Assistant Edition

Use this file as the instruction prompt for Antigravity. Apply it only to the local checkout of `prime-architect/eliza`.

## Objective

Configure Antigravity as a lean development workspace for the ElizaOS Assistant Edition fork. Set up project rules, reusable skills, development workflows, the official GitHub MCP server, and only the editor extension the repository actually needs. Do not implement product features during this task.

## Safety and scope

- Show an implementation plan before changing files.
- Keep all project-specific Antigravity files under `.agents/` in this repository.
- Preserve existing settings, MCP entries, files, and unrelated working-tree changes.
- Do not commit, push, open a pull request, modify a remote, or trigger CI without explicit approval.
- Do not request, print, copy, or commit credentials. Use Antigravity's managed sign-in or secure secret prompt.
- Ask before installing software outside the workspace or changing account-wide settings.
- Do not run destructive commands, reset the repository, clean untracked files, or rewrite history.
- If the working tree is dirty, report the changed paths and stop before creating or switching branches.

---

## 1. Preflight

From the repository root, run read-only checks:

```bash
git status --short
git branch --show-current
git remote -v
git rev-parse --short=9 HEAD
bun --version
node --version
```

Confirm:

- Repository: `prime-architect/eliza`.
- Branch policy: `develop` is the pristine upstream mirror; `main` is upstream plus merged Assistant Edition work; development occurs on `feature/<area>` branches.
- Required tools: Bun `1.4.2`, Node `24.15.0`, ESM, Turbo, and the repository's Biome configuration.
- Before editing any area, read the root `AGENTS.md` and `README.md`, then the nearest package or plugin `AGENTS.md` and `README.md`.

Do not silently substitute package managers or tool versions. Do not add ESLint or Prettier; this repository uses Biome.

---

## 2. Editor setup

Install or enable only the official **Biome** extension from Open VSX (`biomejs.biome`). Configure it to use the repository-local Biome installation and existing configuration. Enable format-on-save only where the checked-in Biome configuration applies.

Use Antigravity's built-in TypeScript support, Git tools, terminal, artifacts, and browser testing. Do not add duplicate AI-chat, Git-history, formatter, or linter extensions.

Do not install codegraph, token/context meters, SonarQube, Linear, or Atlassian integrations in the baseline. First prove a need:

- Add a codegraph/indexer only if native search is measurably inadequate on this monorepo.
- Add SonarQube only after a Sonar server/project exists and its checks complement rather than duplicate `bun run verify`.
- Add Linear or Atlassian only if this project actually uses that tracker.
- Add usage meters only if Antigravity's native usage view is insufficient.

Report any recommended optional extension by exact extension ID, publisher, permissions, maintenance status, and reason before asking to install it.

---

## 3. Workspace rule

Create one concise workspace rule in `.agents/rules/` using the format supported by the installed Antigravity version. Name it `elizaos-development` and encode these requirements:

- Preserve unrelated changes and inspect before editing.
- Read the nearest `AGENTS.md` and package `README.md` first.
- Keep core host-agnostic; prefer plugins, services, providers, evaluators, and actions for Assistant Edition behavior.
- Validate untrusted input at boundaries. Preserve authorization, tenant isolation, cancellation, and effect receipts.
- Use typed errors, the structured logger, and `runtime.reportError`; never fabricate success or convert failures into empty data.
- Reuse the existing scheduler, entity/relationship stores, content-addressed media, and SSRF protections.
- Never hardcode model IDs in feature code; request a capability through the model registry design.
- Keep secrets out of source, logs, prompts, fixtures, URLs, and committed configuration.
- Drizzle migrations are adds-only.
- Verify the owning package first, then the repository-wide gates. UI work also requires desktop/mobile inspection and visual evidence.
- Generic fixes should be suitable for upstream; Assistant Edition behavior stays isolated in the fork.
- Pull requests target `develop` and require the user's approval before creation.

The rule should reference repository guidance rather than duplicating large documents.

---

## 4. Project-local skills

Create these skills under `.agents/skills/<name>/SKILL.md`. Use valid frontmatter with a specific `name` and trigger-oriented `description`. Keep instructions short and point to repository files instead of copying them.

### `repo-orientation`

Use at the start of work in an unfamiliar package.

1. Inspect status, branch, remotes, and current diff.
2. Read applicable `AGENTS.md` and `README.md` files.
3. Identify the owning package, public interfaces, tests, and an existing implementation to follow.
4. Summarize constraints and open questions before proposing edits.

### `feature-planning`

Use before any non-trivial implementation.

Require a plan that names:

- owning package or plugin and why;
- core-versus-plugin boundary;
- API, schema, authorization, approval, audit, memory, and model-registry effects;
- tests and evidence required;
- upstream-conflict risk;
- acceptance criteria and explicitly excluded work.

Do not code until the plan is approved.

### `plugin-implementation`

Use when building or changing an ElizaOS plugin.

- Follow a maintained first-party plugin with the same component types.
- Keep registration, configuration, service lifecycle, actions, providers, evaluators, routes, events, and tests explicit.
- Validate configuration at startup and external data at the boundary.
- Preserve cancellation and return typed failures.
- Put irreversible actions behind approvals and emit auditable effect receipts.
- Add focused tests and update the owning README when the public surface changes.

### `change-verification`

Use after code changes or when diagnosing CI.

1. Run the narrowest owning-package test, typecheck, and lint commands first.
2. Run `bun run verify` when the machine has sufficient memory.
3. Treat OOM, timeout, skipped tests, and missing tools as failures or environment limitations, never passes.
4. For UI work, use Antigravity's browser capability and produce desktop/mobile screenshots or a recording.
5. Report exact commands, outcomes, failures, and untested areas.

### `security-review`

Use for code review and before a PR.

Check authorization, tenant boundaries, scope leaks, prompt/tool injection, SSRF, secrets, approval bypasses, idempotency, cancellation, retries, effect receipts, audit completeness, destructive behavior, dependency changes, and missing negative tests. Separate blockers from recommendations.

### `handoff`

Use when pausing or transferring work.

Record the goal, branch, base commit, files changed, decisions made, commands run, verified results, failures, remaining steps, and exact next command. Never claim a queued or partial check passed.

---

## 5. Workspace workflows

Create the following workspace workflows under `.agents/workflows/`, using the syntax supported by the installed Antigravity version:

- **`/inspect-task`**: run `repo-orientation`, locate the owning package, and return a no-edit assessment.
- **`/plan-feature`**: run `feature-planning` and produce an implementation plan plus acceptance criteria.
- **`/implement-feature`**: confirm an approved plan, implement in small reviewable steps, run focused checks after each step, and stop at any unapproved external action.
- **`/verify-change`**: run `change-verification`, summarize results, and attach UI evidence when applicable.
- **`/review-diff`**: inspect the complete diff, run `security-review`, and identify missing tests or docs.
- **`/prepare-pr`**: verify branch and diff, run required checks, draft a PR title/body and evidence summary, but do not push or create the PR without approval.
- **`/handoff`**: run the handoff skill and produce a continuation-ready status report.

Each workflow must stop on a dirty or unexpected base state rather than hiding it.

---

## 6. Token usage taming and NaraRouter model routing

### Compatibility gate

The intended NaraRouter endpoint is `https://router.bynara.id/v1`. NaraRouter documents OpenAI Chat Completions, OpenAI Responses, and Anthropic Messages compatibility.

Do not claim that Antigravity itself is routed through NaraRouter unless the installed Antigravity version proves it with a successful model-list request and completion. The current official Antigravity documentation exposes no OpenAI-compatible custom-provider field in the IDE. For `agy`, the only documented `modelProvider` value is `gemini`; its custom endpoint variable, `GOOGLE_GEMINI_BASE_URL`, requires a **Gemini-compatible** endpoint. NaraRouter documents OpenAI- and Anthropic-compatible surfaces, not a Gemini-compatible surface. Therefore:

- **Antigravity IDE:** there is no verified place to enter a NaraRouter base URL and API key. Leave this unconfigured unless the installed version or newer official documentation exposes an OpenAI-compatible provider screen. Record the exact UI path before using it.
- **Antigravity CLI:** do not point `GOOGLE_GEMINI_BASE_URL` at NaraRouter and do not add an invented `customEndpoints` block. `~/.gemini/antigravity-cli/settings.json` supports `modelProvider: "gemini"`; `GEMINI_API_KEY` and `GOOGLE_GEMINI_BASE_URL` belong to that Gemini-compatible route only.
- **Closest verified mechanism:** keep Antigravity on its supported provider and invoke NaraRouter through a project-local `nararouter-coding` skill backed by a small OpenAI-compatible client. This routes delegated coding calls through NaraRouter, not Antigravity's own planner or agent loop. State that limitation in the setup report.

If a later Antigravity release adds native OpenAI-compatible providers, use these values only after verifying the new official instructions:

```text
Provider: OpenAI-compatible
Base URL: https://router.bynara.id/v1
API key: <secure NaraRouter secret prompt or environment variable>
```

Never place the real key in `.agents/`, source control, shell history, screenshots, logs, or this guide.

### Verify the account model catalog

NaraRouter's public documentation says the authenticated `/v1/models` response is the authoritative list for the current account and plan. With the key already present in a secure environment variable, query it without printing the key:

```bash
curl --fail --silent --show-error \
  -H "Authorization: Bearer ${NARAROUTER_API_KEY}" \
  https://router.bynara.id/v1/models
```

Check whether the returned model IDs contain the OpenRouter reference ID `stealth/space-bunny-alpha` exactly. It did not appear in NaraRouter's public pricing catalog when this guide was checked, so do not treat OpenRouter availability as proof of NaraRouter availability.

- If the exact ID is present, save it as the coding profile's `model` value.
- If NaraRouter returns a different alias for the same model, use the exact returned alias and record `stealth/space-bunny-alpha` only as the OpenRouter reference ID.
- If no matching model appears, set `nararouter_model_id` to `<NARAROUTER_SPACE_BUNNY_MODEL_ID>` and stop. Do not guess or silently route to a different model.

The fallback coding candidate is `deepseek-v4-flash`, an alias shown in NaraRouter's official API documentation. Enable it only if the authenticated model list also returns that exact ID for this account; otherwise use `<NARAROUTER_FALLBACK_CODING_MODEL_ID>`.

### Project-local routing profile

Create `.agents/nararouter/models.example.json` with no secrets:

```json
{
  "base_url": "https://router.bynara.id/v1",
  "profiles": {
    "free_coding": {
      "openrouter_reference_id": "stealth/space-bunny-alpha",
      "nararouter_model_id": "<NARAROUTER_SPACE_BUNNY_MODEL_ID>",
      "reasoning_effort": "low"
    },
    "fallback_coding": {
      "nararouter_model_id": "deepseek-v4-flash",
      "reasoning_effort": "medium",
      "enable_only_if_returned_by_v1_models": true,
      "requires_cost_approval": true
    },
    "cheap_general": {
      "nararouter_model_id": "<CHEAP_HIGH_QUALITY_MODEL_FROM_LIVE_CATALOG>",
      "reasoning_effort": "low"
    },
    "strong_paid": {
      "nararouter_model_id": "<STRONG_PAID_MODEL_FROM_LIVE_CATALOG>",
      "reasoning_effort": "medium",
      "requires_cost_approval": true
    }
  }
}
```

After the live catalog check, create a user-local resolved copy outside source control or supply the values through environment variables. Do not commit account entitlements, balances, or keys. Keeping model IDs in routing configuration is intentional; the repository rule against hardcoded model IDs still applies to product feature code.

Create `.agents/skills/nararouter-coding/SKILL.md` and a minimal companion client under the same skill directory. The client must:

- read `NARAROUTER_API_KEY` from the environment;
- use `https://router.bynara.id/v1` and the OpenAI-compatible API;
- accept the model profile, reasoning effort, maximum output, and prompt at runtime;
- send only files explicitly selected for the task, never the entire repository by default;
- return token-usage fields when the gateway supplies them;
- never log the key, authorization header, full prompt, or proprietary response;
- fail closed on unknown models, `401`, `403`, or `429`; and
- never switch into a paid profile without explicit approval.

This skill is a delegated inference helper. It is not a substitute for Antigravity's native tool loop. A full external coding-agent integration that exercises tool calling requires a separately approved client and configuration.

### Escalation ladder

Use the cheapest adequate route, not the strongest model by default:

1. **No model call:** use repository search, language-server results, existing tests, and deterministic commands first.
2. **Free coding:** use the verified NaraRouter alias for Space Bunny with `reasoning_effort: low` for code reading, focused edits, test generation, and ordinary debugging.
3. **Other free model:** if Space Bunny is unavailable, rate-limited, or unsuitable, choose a capable free model returned by the authenticated catalog. Save the exact alias in the local profile.
4. **Cheap paid model:** use the live catalog and NaraRouter pricing display to select `<CHEAP_HIGH_QUALITY_MODEL_FROM_LIVE_CATALOG>` only for work that the free tier cannot complete reliably.
5. **Strong paid model:** use `<STRONG_PAID_MODEL_FROM_LIVE_CATALOG>` only for cross-package architecture, difficult concurrency bugs, migrations, security-sensitive review, or repeated validated failure at lower tiers.

Escalate only when one of these is true: the current model is unavailable; it fails the same acceptance test twice after a corrected prompt; the task exceeds its verified modality, context, or tool capability; or the work is in a high-risk category that requires stronger review. Ask before crossing from free to paid.

Start reasoning at `low`. Move to `medium` for multi-step debugging and `high` only for difficult planning or proof-like work. Higher reasoning uses more output tokens and latency. Keep prompts narrow, request patches rather than full-file rewrites, cap output, start a fresh conversation when the task changes, and summarize before context becomes large.

### Space Bunny operating policy

Space Bunny's OpenRouter reference ID is `stealth/space-bunny-alpha`. Treat it as the preferred free coding model only after NaraRouter's authenticated catalog confirms its exact NaraRouter alias. The supplied model description reports a 1 million-token context window, coding strength, adjustable reasoning, tool calling, and OpenAI-compatible access.

The provider is anonymous and the free-preview period has no published end date. The endpoint reportedly went offline briefly at launch. Do not make it the only route: keep the verified fallback coding model in configuration, fail visibly when the primary is unavailable, and never assume preview pricing or availability is permanent.

### Token and cost observability

Use monitoring in this order:

1. **Antigravity native usage:** use `/usage` in `agy` to inspect model quota. Do not install a duplicate meter until this proves insufficient.
2. **Antigravity context meter:** use the CLI's native status-line payload, which exposes input, output, cache, context-window, percentage-used, and quota fields. If customizing it, ask before changing the account-wide `~/.gemini/antigravity-cli/settings.json` and preserve existing settings.
3. **NaraRouter dashboard:** review per-model usage, token totals, remaining credits, plan caps, and rate limits before enabling a paid profile. Set the lowest practical credit control and do not enable automatic paid escalation.
4. **Optional extensions:** treat “Usage Intelligence” and “Context Meter” as capability labels, not verified extension IDs. Before installation, replace `<USAGE_INTELLIGENCE_EXTENSION_ID>` and `<CONTEXT_METER_EXTENSION_ID>` with exact Open VSX IDs verified in the installed Antigravity marketplace. Report publisher, permissions, maintenance status, and overlap with native telemetry. If either cannot be verified, do not install it.

For every delegated NaraRouter run, record only the model alias, profile tier, input/output token counts, result status, and whether a fallback occurred. Do not retain prompts, responses, account balances, or keys in repository logs.

---

## 7. Official GitHub MCP server

Use only GitHub's official `github/github-mcp-server`.

### Preferred remote setup

1. Open **Settings → Customizations → Installed MCP Servers**.
2. Use **Add MCP** if the official GitHub entry is available. Prefer the hosted remote server and managed OAuth.
3. If manual remote configuration is required, open Antigravity's MCP config from that screen. The documented shared location is `~/.gemini/config/mcp_config.json`; preserve every existing entry.
4. Configure the official remote endpoint `https://api.githubcopilot.com/mcp/` using the exact schema shown by the installed Antigravity version.
5. Authenticate through the managed OAuth flow. Do not create or paste a PAT when OAuth is available.

If the installed Antigravity version does not support OAuth for this remote MCP, stop and report the limitation. A PAT fallback must use a password-style secure prompt or supported secret reference, minimum scopes, and read-only mode. Never put the token directly in JSON.

Start with only repository context, repository reads, issues, pull requests, and user lookup. Keep write tools disabled. The server's default toolsets are `context`, `repos`, `issues`, `pull_requests`, and `users`; remove anything not needed for this fork. Do not enable actions, security-alert, branch-write, issue-write, or pull-request-write tools without a concrete task and approval.

### Local Docker fallback

Use this only if remote MCP is unsupported and Docker is already installed and running. Ask before installing Docker.

- Image: `ghcr.io/github/github-mcp-server`
- Authentication: prefer the official container's browser OAuth flow when supported; otherwise pass `GITHUB_PERSONAL_ACCESS_TOKEN` from a secure environment source.
- Read-only: set `GITHUB_READ_ONLY=1`.
- Toolsets: set `GITHUB_TOOLSETS` to the smallest verified set.

Do not copy a token into `.agents/`, `.env`, MCP JSON, or shell history. If the host cannot inject a secret securely, do not configure the local server.

### Verification

- Confirm the server appears in Antigravity and lists only the intended tools.
- Read repository metadata and one public file from `prime-architect/eliza`.
- Confirm write tools are absent or blocked.
- Do not create an issue, branch, commit, PR, workflow run, or comment as a test.

---

## 8. Repository-specific setup sequence

1. Open the local checkout of `prime-architect/eliza` as the Antigravity project.
2. Run the preflight checks in section 1. If the tree is dirty or the remote does not match the intended fork, report it and stop.
3. Read the root `AGENTS.md`, `README.md`, `UPSTREAM.md`, and `package.json`.
4. Confirm the checked-out base is the intended `develop` line before creating work. Do not reset, pull, fetch, or switch branches without approval.
5. After approval, create or select `feature/<area>`. Replace `<area>` with the approved feature slug; do not literally create a branch containing angle brackets.
6. Install or enable the official Biome extension only after showing its publisher and extension ID.
7. Create the rule, skills, workflows, NaraRouter routing profile, and GitHub MCP configuration described here. Preserve any existing `.agents/` content and merge rather than overwrite.
8. Do not implement Assistant Edition product features as part of setup.

Verify setup with non-destructive checks:

```bash
git status --short
find .agents -maxdepth 3 -type f -print | sort
bun --version
```

Then ask Antigravity to list discovered rules, skills, workflows, agents, and MCP servers. Run `/inspect-task` against one package as a no-edit smoke test. Run a single NaraRouter model-list check and one minimal delegated prompt only after the user has securely supplied the key and approved sending that prompt to NaraRouter.

For code verification later, start with the owning package. Use `RUN_TURBO_CONCURRENCY=1 bun run verify` only on a host with at least 16 GB RAM. On smaller machines, run focused checks and report the full verification gate as unrun; do not call an OOM or timeout a pass.

---

## 9. Optional evaluations, not baseline installs

Evaluate these only when a specific problem justifies them:

- **Antigravity ACP or programmatic driving:** community reports describe an ACP-compatible route, but this was not verified in Google's official setup documentation. Treat it as an experiment and do not install it in the baseline.
- **Codegraph or indexer:** benchmark native search first; require a measurable navigation or retrieval gap.
- **SonarQube:** require an existing server, project, and rule set that adds checks not already covered by Biome and `bun run verify`.
- **Linear or Atlassian:** require active use of that tracker and a least-privilege connection plan.
- **Usage Intelligence or Context Meter extensions:** native `agy /usage`, the CLI status-line token payload, and NaraRouter's dashboard come first. Install an extension only after its exact Open VSX identity and permissions are verified.
- **External NaraRouter coding client:** use only if the project-local delegated skill is insufficient and the user approves the client, installation, configuration files, and data sent through it.

For every optional tool, report the expected benefit, overlap, permissions, maintenance status, data destination, cost, uninstall path, and acceptance test before requesting approval.

---

## Completion checklist

Before reporting setup complete, confirm:

- Only approved files changed, with all project-specific Antigravity files under `.agents/`.
- Existing rules, workflows, skills, MCP entries, and local changes were preserved.
- Biome is the only baseline extension added.
- GitHub MCP uses the official server, least privilege, and read-only tools.
- No credential appears in files, diffs, logs, screenshots, commands, or chat output.
- NaraRouter's base URL is `https://router.bynara.id/v1`.
- The Space Bunny NaraRouter alias came from the authenticated `/v1/models` response; otherwise the placeholder remains unresolved and the model is not used.
- Free-to-paid escalation requires approval and every paid profile came from the live account catalog and current pricing display.
- Native `/usage`, context-window status, and NaraRouter dashboard monitoring were checked before any optional extension.
- No product feature, commit, push, PR, remote, CI run, or account setting was changed without approval.
- The final report distinguishes completed, skipped, blocked, and approval-required items and includes exact verification commands and outcomes.

---

## Sources

External references checked on October 5–6, 2026:

- [Google Antigravity getting-started codelab](https://codelabs.developers.google.com/getting-started-agy-ide)
- [Google Antigravity CLI installation and authentication](https://antigravity.google/docs/cli/install/)
- [Google Antigravity CLI headless mode](https://antigravity.google/docs/cli/headless/)
- [Google Antigravity CLI status-line customization](https://antigravity.google/docs/cli/statusline/)
- [Google Antigravity custom subagents](https://antigravity.google/docs/subagents/)
- [NaraRouter](https://router.bynara.id)
- [NaraRouter API documentation](https://router.bynara.id/docs)
- [NaraRouter pricing and public model catalog](https://router.bynara.id/pricing)
- [Official GitHub MCP server](https://github.com/github/github-mcp-server)
- [Official Biome extension on Open VSX](https://open-vsx.org/extension/biomejs/biome)
- [OpenRouter stealth-model catalog](https://openrouter.ai/stealth)

Repository references to read from the checked-out fork:

- `AGENTS.md`
- `README.md`
- `UPSTREAM.md`
- `package.json`

The exact NaraRouter Space Bunny alias, paid-model aliases, account entitlements, current prices, and extension IDs labeled as placeholders must be resolved from the live account or installed marketplace at setup time. Do not infer them from OpenRouter IDs or third-party posts.
