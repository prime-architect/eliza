/** Validates the actual deployment dependency closure for managed browser controllers. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const read = (path) => readFileSync(resolve(root, path), "utf8");


test("standalone cloud image ships reviewed host code and invokes it after runtime initialization", () => {
  const docker = read("packages/app/deploy/Dockerfile.cloud-agent");
  const entry = read("packages/app/deploy/cloud-agent-shared.ts");
  assert.match(
    docker,
    /COPY eliza\/plugins\/plugin-browser plugins\/plugin-browser/,
  );
  const { packageManager } = JSON.parse(read("package.json"));
  assert.ok(packageManager.startsWith("bun@"));
  assert.ok(
    docker.includes(`FROM oven/bun:${packageManager.slice(4)} AS bun-runtime`),
  );
  assert.match(
    docker,
    /CMD \["bun", "--conditions=eliza-source", "entrypoint.mjs"\]/,
  );
  assert.doesNotMatch(docker, /@elizaos\/core@alpha/);
  assert.ok(
    entry.indexOf("await remoteHost.restoreRemoteBrowserController(runtime)") >
      entry.indexOf("await runtime.initialize()"),
  );
  assert.ok(
    entry.indexOf("if (remoteBrowserPath)") >
      entry.indexOf("if (authHeader !== `Bearer"),
  );
  assert.match(entry, /remoteBrowser\.pair\(body, ownerId\)/);
});
