import { describe, expect, it } from "vitest";
import {
  buildChartSeries,
  parseDashboardRange,
  percentageChange,
} from "../../lib/admin-analytics";

const now = new Date("2026-07-21T15:00:00.000Z");

describe("admin analytics", () => {
  it("creates preset and preceding comparison periods", () => {
    const range = parseDashboardRange({ range: "7" }, now);
    expect(range.fromInput).toBe("2026-07-15");
    expect(range.toInput).toBe("2026-07-21");
    expect(range.previousFrom.toISOString().slice(0, 10)).toBe("2026-07-08");
    expect(range.days).toBe(7);
  });

  it("accepts safe custom dates and falls back for invalid future ranges", () => {
    const custom = parseDashboardRange(
      { range: "custom", from: "2026-06-01", to: "2026-06-30" },
      now,
    );
    expect(custom.key).toBe("custom");
    expect(custom.days).toBe(30);
    const invalid = parseDashboardRange(
      { range: "custom", from: "2026-08-01", to: "2026-08-10" },
      now,
    );
    expect(invalid.key).toBe("7");
  });

  it("counts all orders while excluding cancellations from revenue", () => {
    const range = parseDashboardRange({ range: "7" }, now);
    const points = buildChartSeries(
      [
        {
          createdAt: new Date("2026-07-21T10:00:00.000Z"),
          totalCents: 5000,
          status: "DELIVERED",
        },
        {
          createdAt: new Date("2026-07-21T11:00:00.000Z"),
          totalCents: 9000,
          status: "CANCELLED",
        },
      ],
      range,
    );
    expect(points.at(-1)).toMatchObject({ orders: 2, revenueCents: 5000 });
  });

  it("calculates period comparisons without dividing by zero", () => {
    expect(percentageChange(120, 100)).toBe(20);
    expect(percentageChange(10, 0)).toBeNull();
    expect(percentageChange(0, 0)).toBe(0);
  });
});
