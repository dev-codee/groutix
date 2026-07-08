// Temporary diagnostic: reads .env.local and tests the Brevo transactional API.
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

console.log("API key prefix:", (env.BREVO_API_KEY || "").slice(0, 10) + "...");
console.log("From:", env.BREVO_FROM);

try {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "GROUTIX Test", email: env.BREVO_FROM },
      to: [{ email: env.BREVO_FROM }],
      subject: "Brevo API test",
      htmlContent: "<p>If you received this, the Brevo API works.</p>",
    }),
  });
  const body = await res.text();
  if (res.ok) {
    console.log("\n✅ Brevo API OK:", body);
  } else {
    console.error(`\n❌ Brevo API ${res.status}:`, body);
  }
} catch (err) {
  console.error("\n❌ Request failed:", err);
}
