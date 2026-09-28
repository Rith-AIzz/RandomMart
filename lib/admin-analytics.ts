export type DashboardRangeKey = "7" | "30" | "90" | "custom";

export type DashboardRange = {
  key: DashboardRangeKey;
  from: Date;
  to: Date;
  endExclusive: Date;
  previousFrom: Date;
  previousEndExclusive: Date;
  days: number;
  label: string;
  fromInput: string;
  toInput: string;
  timeZone: string;
};

export type TimedOrder = {
  createdAt: Date;
  totalCents: number;
  status: string;
};

const DAY_MS = 86_400_000;
const presets: Record<Exclude<DashboardRangeKey, "custom">, number> = {
  "7": 7,
  "30": 30,
  "90": 90,
};

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || isoDate(date) !== value ? null : date;
}

export const dashboardTimeZones = [
  "UTC",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
] as const;

export function safeTimeZone(value: unknown, fallback = "UTC") {
  const candidate = typeof value === "string" ? value : fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return fallback;
  }
}

function calendarKeyInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function zonedMidnight(calendarDate: Date, timeZone: string) {
  const target = Date.UTC(
    calendarDate.getUTCFullYear(),
    calendarDate.getUTCMonth(),
    calendarDate.getUTCDate(),
  );
  let instant = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).formatToParts(new Date(instant));
    const value = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const displayedAsUtc = Date.UTC(
      Number(value.year),
      Number(value.month) - 1,
      Number(value.day),
      Number(value.hour),
      Number(value.minute),
      Number(value.second),
    );
    instant += target - displayedAsUtc;
  }
  return new Date(instant);
}

export function parseDashboardRange(
  params: Record<string, string | string[] | undefined>,
  now = new Date(),
  defaultTimeZone = "UTC",
): DashboardRange {
  const timeZone = safeTimeZone(params.timezone, safeTimeZone(defaultTimeZone));
  const today = parseIsoDate(calendarKeyInZone(now, timeZone)) ?? new Date();
  const requested = typeof params.range === "string" ? params.range : "7";
  const key: DashboardRangeKey =
    requested === "30" || requested === "90" || requested === "custom"
      ? requested
      : "7";

  let to = new Date(today);
  let from = new Date(today);
  let effectiveKey = key;

  if (key === "custom") {
    const parsedFrom = parseIsoDate(params.from);
    const parsedTo = parseIsoDate(params.to);
    if (parsedFrom && parsedTo && parsedFrom <= parsedTo && parsedTo <= today) {
      from = parsedFrom;
      to = parsedTo;
      const requestedDays =
        Math.floor((to.valueOf() - from.valueOf()) / DAY_MS) + 1;
      if (requestedDays > 366) from = new Date(to.valueOf() - 365 * DAY_MS);
    } else {
      effectiveKey = "7";
      from.setUTCDate(today.getUTCDate() - 6);
    }
  } else {
    from.setUTCDate(today.getUTCDate() - (presets[key] - 1));
  }

  const days = Math.floor((to.valueOf() - from.valueOf()) / DAY_MS) + 1;
  const endCalendar = new Date(to.valueOf() + DAY_MS);
  const previousFromCalendar = new Date(from.valueOf() - days * DAY_MS);
  const fromInput = isoDate(from);
  const toInput = isoDate(to);
  const endExclusive = zonedMidnight(endCalendar, timeZone);
  const previousEndExclusive = zonedMidnight(from, timeZone);
  const previousFrom = zonedMidnight(previousFromCalendar, timeZone);
  const rangeFrom = zonedMidnight(from, timeZone);
  const rangeTo = zonedMidnight(to, timeZone);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: from.getUTCFullYear() === to.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  });

  return {
    key: effectiveKey,
    from: rangeFrom,
    to: rangeTo,
    endExclusive,
    previousFrom,
    previousEndExclusive,
    days,
    label: `${dateFormatter.format(from)} – ${dateFormatter.format(to)}`,
    fromInput,
    toInput,
    timeZone,
  };
}

export function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function buildChartSeries(rows: TimedOrder[], range: DashboardRange) {
  const bucketDays = range.days <= 14 ? 1 : Math.ceil(range.days / 14);
  const points = [];

  for (let offset = 0; offset < range.days; offset += bucketDays) {
    const startCalendar = parseIsoDate(range.fromInput) ?? new Date();
    startCalendar.setUTCDate(startCalendar.getUTCDate() + offset);
    const endCalendar = new Date(startCalendar);
    endCalendar.setUTCDate(
      startCalendar.getUTCDate() + Math.min(bucketDays, range.days - offset),
    );
    const start = zonedMidnight(startCalendar, range.timeZone);
    const end = zonedMidnight(endCalendar, range.timeZone);
    const bucket = rows.filter(
      (order) => order.createdAt >= start && order.createdAt < end,
    );
    const completed = bucket.filter((order) => order.status !== "CANCELLED");
    points.push({
      key: isoDate(startCalendar),
      label: new Intl.DateTimeFormat(
        "en-US",
        range.days <= 14
          ? { weekday: "short", timeZone: "UTC" }
          : { month: "short", day: "numeric", timeZone: "UTC" },
      ).format(startCalendar),
      fullLabel: `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(startCalendar)}${bucketDays > 1 ? ` – ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(endCalendar.valueOf() - DAY_MS))}` : ""}`,
      revenueCents: completed.reduce((sum, order) => sum + order.totalCents, 0),
      orders: bucket.length,
    });
  }

  return points;
}
