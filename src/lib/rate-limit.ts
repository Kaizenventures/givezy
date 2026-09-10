import { NextRequest } from "next/server";

/**
 * Small in-process fixed-window limiter. The app runs as a single container,
 * so a shared map is sufficient; move this to Redis if it is ever scaled out.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}

export function clientIp(req: NextRequest): string {
  // Caddy sits in front of the app, so trust its forwarding headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Convenience wrapper: returns null when allowed, or a 429 Response. */
export function enforceRateLimit(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number,
): Response | null {
  const result = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  if (result.ok) return null;

  return new Response(
    JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
