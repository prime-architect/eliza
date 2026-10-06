import { openaiPlugin } from "@elizaos/plugin-openai";
import { ModelType } from "@elizaos/core";

// Mock minimal runtime
const runtime = {
  getSetting: (key: string) => process.env[key],
  character: { name: "Eliza", modelProvider: "openai" },
  emitEvent: () => {},
} as any;

console.log("Testing ModelType.TEXT_SMALL directly via openaiPlugin...");
try {
  const handler = openaiPlugin.models[ModelType.TEXT_SMALL];
  const result = await handler(runtime, {
    prompt: "Respond with exactly: NARAROUTER_OK",
  });
  console.log("Result:", result);
} catch (err) {
  console.error("Direct handler error:", err);
}
