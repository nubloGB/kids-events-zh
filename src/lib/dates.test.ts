import { formatChipRange, formatRange, isoWeekday, msUntilNextZurichMidnight, presetRange, resolveDateRange, zurichToday } from "./dates";
import { describe, expect, it } from "vitest";

describe("presetRange", () => {
  const monday = "2026-10-19";

  it("uses the Zurich examples for Monday 19 October 2026", () => {
    expect(isoWeekday(monday)).toBe(1);
    expect(formatRange(presetRange("today", monday))).toBe("19.10.");
    expect(formatRange(presetRange("tomorrow", monday))).toBe("20.10.");
    expect(formatRange(presetRange("thisWeek", monday))).toBe("19.10.–25.10.");
    expect(formatRange(presetRange("thisWeekend", monday))).toBe("24.10.–25.10.");
    expect(formatRange(presetRange("nextWeek", monday))).toBe("26.10.–01.11.");
    expect(formatRange(presetRange("nextMonth", monday))).toBe("01.11.–30.11.");
  });

  it("starts this week today and sends Sunday to the next weekend", () => {
    expect(formatRange(presetRange("thisWeek", "2026-10-21"))).toBe("21.10.–25.10.");
    expect(formatRange(presetRange("thisWeekend", "2026-10-21"))).toBe("24.10.–25.10.");
    expect(formatRange(presetRange("nextWeek", "2026-10-21"))).toBe("26.10.–01.11.");
    expect(formatRange(presetRange("thisWeek", "2026-10-24"))).toBe("24.10.–25.10.");
    expect(formatRange(presetRange("thisWeekend", "2026-10-24"))).toBe("24.10.–25.10.");
    expect(formatRange(presetRange("thisWeek", "2026-10-25"))).toBe("25.10.");
    expect(formatRange(presetRange("thisWeekend", "2026-10-25"))).toBe("31.10.–01.11.");
    expect(formatRange(presetRange("nextWeek", "2026-10-25"))).toBe("26.10.–01.11.");
  });

  it("keeps the weekend on Saturday and Sunday, and on a Sunday takes the next one", () => {
    expect(presetRange("thisWeekend", "2026-11-20")).toEqual({ from: "2026-11-21", to: "2026-11-22" });
    expect(presetRange("thisWeekend", "2026-11-21")).toEqual({ from: "2026-11-21", to: "2026-11-22" });
    expect(isoWeekday("2026-11-22")).toBe(7);
    expect(presetRange("thisWeekend", "2026-11-22")).toEqual({ from: "2026-11-28", to: "2026-11-29" });
    expect(formatChipRange(presetRange("today", "2026-11-22"))).toBe("22.11");
  });

  it("treats Tydzień as seven days from today and Miesiąc as 30 days from today", () => {
    expect(presetRange("rollingWeek", "2026-11-22")).toEqual({ from: "2026-11-22", to: "2026-11-28" });
    expect(presetRange("rollingMonth", "2026-11-22")).toEqual({ from: "2026-11-22", to: "2026-12-22" });
    expect(presetRange("rollingMonth", "2026-01-31")).toEqual({ from: "2026-01-31", to: "2026-03-02" });
    expect(resolveDateRange({ kind: "all" }, "2026-11-22")).toBeNull();
  });

  it("takes the whole next calendar month, including a year boundary and a leap February", () => {
    expect(presetRange("nextMonth", "2026-12-15")).toEqual({ from: "2027-01-01", to: "2027-01-31" });
    expect(presetRange("nextMonth", "2028-01-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
});

describe("Zurich midnight", () => {
  it("flips the calendar at Zurich midnight rather than UTC midnight", () => {
    // Winter CET (UTC+1): 22 Nov 2026 00:00 in Zurich is 21 Nov 23:00 UTC.
    expect(zurichToday(new Date("2026-11-21T22:59:00Z"))).toBe("2026-11-21");
    expect(zurichToday(new Date("2026-11-21T23:00:00Z"))).toBe("2026-11-22");
    // Summer CEST (UTC+2): 15 Jul 2026 00:00 in Zurich is 14 Jul 22:00 UTC.
    expect(zurichToday(new Date("2026-07-14T21:59:00Z"))).toBe("2026-07-14");
    expect(zurichToday(new Date("2026-07-14T22:00:00Z"))).toBe("2026-07-15");
  });

  it("schedules the refresh for the following Zurich midnight", () => {
    const before = new Date("2026-11-21T22:30:00Z");
    expect(zurichToday(before)).toBe("2026-11-21");
    expect(msUntilNextZurichMidnight(before)).toBe(30 * 60 * 1000);
    const atMidnight = new Date(before.getTime() + msUntilNextZurichMidnight(before));
    expect(zurichToday(atMidnight)).toBe("2026-11-22");
    expect(isoWeekday(zurichToday(atMidnight))).toBe(7);
    expect(presetRange("thisWeekend", zurichToday(atMidnight))).toEqual({ from: "2026-11-28", to: "2026-11-29" });
  });

  it("resolves Dziś from the Zurich day when the device clock is still on the previous date", () => {
    const now = new Date("2026-11-21T23:30:00Z");
    const today = zurichToday(now);
    expect(today).toBe("2026-11-22");
    expect(now.toISOString().slice(0, 10)).toBe("2026-11-21");
    expect(resolveDateRange({ kind: "today" }, today)).toEqual({ from: "2026-11-22", to: "2026-11-22" });
    expect(presetRange("thisWeekend", today)).toEqual({ from: "2026-11-28", to: "2026-11-29" });
  });
});
