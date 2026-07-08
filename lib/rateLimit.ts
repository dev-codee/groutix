// Lightweight in-memory rate limiter (sliding window), keyed by an arbitrary
// string such as the client IP. Good enough to stop spam bursts on the quote
// form without any external service.
//
// Caveat: state lives in the server process's memory. On serverless hosts
// (e.g. Vercel) each instance has its own map, so this is a "best effort"
// throttle rather than a hard global guarantee. Combined with Turnstile it's
// plenty for a marketing site. For a strict global limit, back it with Redis
// (e.g. Upstash) later.

type Timestamps = number[];

const hits = new Map<string, Timestamps>();

// Occasionally drop stale keys so the map can't grow unbounded.
let lastSweep = Date.now();
function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    const fresh = times.filter((t) => now - t < windowMs);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

/**
 * @returns `true` if the request is allowed, `false` if the limit is exceeded.
 */
export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  sweep(windowMs);
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
