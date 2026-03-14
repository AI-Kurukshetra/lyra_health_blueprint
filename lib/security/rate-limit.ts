import { NextResponse } from "next/server";

interface WindowEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, WindowEntry>();

interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowMs: number;
}

export function enforceRateLimit(options: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  const existing = inMemoryStore.get(options.key);

  if (!existing || existing.resetAt <= now) {
    inMemoryStore.set(options.key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (existing.count >= options.maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  existing.count += 1;
  inMemoryStore.set(options.key, existing);
  return null;
}

export function getRateLimitKey(request: Request, operation: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${operation}:${forwardedFor}`;
}

