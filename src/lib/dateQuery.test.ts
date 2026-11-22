import { parseDateQuery, serializeDate } from "./dateQuery";
import { describe, expect, it } from "vitest";

describe("date query", () => {
  it("treats Dziś as the omitted default and keeps Wszystkie in the URL", () => {
    expect(serializeDate({ kind: "today" })).toBeNull();
    expect(parseDateQuery(null)).toEqual({ kind: "today" });
    expect(parseDateQuery("")).toEqual({ kind: "today" });
    expect(serializeDate({ kind: "all" })).toBe("all");
    expect(parseDateQuery("all")).toEqual({ kind: "all" });
    expect(parseDateQuery("today")).toEqual({ kind: "today" });
    expect(serializeDate({ kind: "thisWeekend" })).toBe("thisWeekend");
    expect(parseDateQuery("rollingMonth")).toEqual({ kind: "rollingMonth" });
    const custom = { kind: "custom" as const, from: "2026-12-12", to: "2026-12-18" };
    expect(parseDateQuery(serializeDate(custom))).toEqual(custom);
    expect(parseDateQuery("custom:2026-12-12:")).toEqual({ kind: "custom", from: "2026-12-12", to: "" });
    expect(parseDateQuery("nope")).toBeNull();
  });
});