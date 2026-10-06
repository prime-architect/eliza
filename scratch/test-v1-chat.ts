const url = "http://localhost:31337/v1/chat/completions";
console.log("Testing POST /v1/chat/completions...");
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "nemotron-3.5-lightning-free",
    messages: [
      { role: "user", content: "Respond with exactly: V1_CHAT_OK" }
    ],
  }),
});

console.log("Status:", res.status, res.statusText);
const body = await res.text();
console.log("Body:", body);
