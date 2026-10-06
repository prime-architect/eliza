// Auto-enable check for @elizaos/plugin-elizacloud.
//
// Plugin manifest entry-point — referenced by package.json's
// `elizaos.plugin.autoEnableModule`. Keep this module light: env reads only,
// no service init, no transitive imports of the full plugin runtime. The
// auto-enable engine loads dozens of these per boot.
import type { PluginAutoEnableContext } from "@elizaos/core";

function isTruthyCloudFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

/** Never enable Eliza Cloud in autonomous/stripped local-first installations. */
export function shouldEnable(_ctx: PluginAutoEnableContext): boolean {
  return false;
}
