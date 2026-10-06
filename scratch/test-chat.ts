const url = "http://localhost:31337/api/conversations/ef98fc47-4609-41b7-99d4-9a01c5f6cae2/messages";
console.log("Sending chat message to:", url);
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Hello Eliza, are you running and connected to NaraRouter? Please state your status briefly.",
  }),
});

console.log("Status:", res.status, res.statusText);
const json = await res.json();
console.log("Response:", JSON.stringify(json, null, 2));
