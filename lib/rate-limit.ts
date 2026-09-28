import { ApplicationError } from "./application-error";

type RateLimitRecord = {
  timestamps: number[];
};

const localStore = new Map<string, RateLimitRecord>();

export type RateLimitConfig = {
  maxRequests: number;
  windowSeconds: number;
};

export const PRESET_RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowSeconds: 60 },
  MUTATION: { maxRequests: 20, windowSeconds: 60 },
  SEARCH: { maxRequests: 60, windowSeconds: 60 },
  ADMIN: { maxRequests: 30, windowSeconds: 60 },
  STRICT: { maxRequests: 3, windowSeconds: 60 },
} as const;

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = PRESET_RATE_LIMITS.MUTATION,
): { success: boolean; limit: number; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  let record = localStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    localStore.set(identifier, record);
  }

  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= config.maxRequests) {
    const oldest = record.timestamps[0] ?? now;
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.timestamps.length,
    resetSeconds: config.windowSeconds,
  };
}

export async function checkRateLimitDistributed(
  identifier: string,
  config: RateLimitConfig = PRESET_RATE_LIMITS.MUTATION,
): Promise<{ success: boolean; limit: number; remaining: number; resetSeconds: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, config.windowSeconds],
        ]),
      });

      if (res.ok) {
        const data = (await res.json()) as Array<{ result: number }>;
        const currentCount = data[0]?.result ?? 1;
        const remaining = Math.max(0, config.maxRequests - currentCount);

        return {
          success: currentCount <= config.maxRequests,
          limit: config.maxRequests,
          remaining,
          resetSeconds: config.windowSeconds,
        };
      }
    } catch (err) {
      console.warn("Upstash Redis rate limit call failed, using local fallback:", err);
    }
  }

  return checkRateLimit(identifier, config);
}

export function enforceRateLimit(
  request: Request,
  actionKey: string,
  config: RateLimitConfig = PRESET_RATE_LIMITS.MUTATION,
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const identifier = `${actionKey}:${ip}`;

  const result = checkRateLimit(identifier, config);
  if (!result.success) {
    throw new ApplicationError(
      "RATE_LIMIT_EXCEEDED",
      429,
      `Too many requests. Please try again in ${result.resetSeconds} seconds.`,
    );
  }
}
