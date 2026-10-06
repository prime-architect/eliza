import { loadElizaConfig } from "../packages/agent/src/config/config.ts";
import { collectPluginNames } from "../packages/agent/src/runtime/plugin-collector.ts";

const config = loadElizaConfig();
const reasons = new Map<string, string>();
const plugins = collectPluginNames(config, reasons);

console.log("Collected plugins:", Array.from(plugins));
console.log("Reasons:", Object.fromEntries(reasons));
