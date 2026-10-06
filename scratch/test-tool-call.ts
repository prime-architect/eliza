import { openaiPlugin } from "@elizaos/plugin-openai";
import { ModelType } from "@elizaos/core";

const runtime = {
  getSetting: (key: string) => process.env[key],
  character: { name: "Eliza", modelProvider: "openai" },
  emitEvent: () => {},
  logger: console,
} as any;

console.log("Testing tool calling with NaraRouter...");
const tools = [
  {
    name: "handle_response",
    description: "Stage 1 decision tool",
    parameters: {
      type: "object",
      properties: {
        shouldRespond: { type: "string", enum: ["RESPOND", "IGNORE"] },
        replyText: { type: "string" },
      },
      required: ["shouldRespond"],
    },
  },
];

try {
  const handler = openaiPlugin.models[ModelType.TEXT_SMALL];
  const result = await handler(runtime, {
    prompt: "The user says 'Hello!'. Call handle_response with shouldRespond: RESPOND and replyText: 'Hi there!'",
    tools,
  } as any);
  console.log("Result with tools:", result);
} catch (err: any) {
  console.error("Error during tool call:", err?.message || err);
  if (err?.cause) console.error("Cause:", err.cause);
  if (err?.responseBody) console.error("ResponseBody:", err.responseBody);
}
