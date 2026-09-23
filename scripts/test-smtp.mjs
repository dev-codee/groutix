// Temporary diagnostic: reads .env.local and tests the Nodemailer SMTP connection.
// Run with: node scripts/test-smtp.mjs

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import nodemailer from "nodemailer";

function loadEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }
  return env;
}

const env = loadEnv();

if (!env.SMTP_USER || !env.SMTP_PASS) {
  console.error(
    "❌ Missing SMTP_USER or SMTP_PASS in .env.local. Please configure your email host."
  );
  process.exit(1);
}

const host = env.SMTP_HOST || "smtp.gmail.com";
const port = Number(env.SMTP_PORT || 465);
const secure = port === 465;
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const from = env.SMTP_FROM || user;

console.log("Configured SMTP:");
console.log("- Host:", host);
console.log("- Port:", port);
console.log("- User:", user);
console.log("- From:", from);

console.log("\nAttempting to send a test email to:", from);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
});

const mailOptions = {
  from: `"GROUTIX Test" <${from}>`,
  to: from,
  subject: "Nodemailer SMTP Test",
  html: "<p>If you received this, your Google Workspace SMTP works perfectly!</p>",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("\n❌ Email send failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } else {
    console.log("\n✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    process.exit(0);
  }
});
