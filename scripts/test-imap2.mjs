import 'dotenv/config.js';
import { ImapFlow } from "imapflow";

const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";

async function run() {
  console.log("Starting IMAP...", user);
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: console, // enable logging to see where it hangs
  });

  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected!");
    
    console.log("Searching...");
    const lock = await client.getMailboxLock("INBOX");
    const uids = await client.search({ seen: false });
    console.log("Found:", uids.length);
    lock.release();
    
    console.log("Logging out...");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.logout();
    console.log("Logged out.");
    process.exit(0);
  }
}
run();
