import 'dotenv/config.js';
import { syncUnreadEmails } from '../lib/imap.js';
import { getDb } from '../lib/mongodb.js';

// Setup basic polyfill/mock for next/server and lib/submissions since we run directly
async function run() {
  console.log("Starting IMAP sync...");
  const start = Date.now();
  try {
    const result = await syncUnreadEmails();
    console.log("Finished successfully in", Date.now() - start, "ms", result);
  } catch (err) {
    console.error("Failed:", err);
  }
  process.exit(0);
}

run();
