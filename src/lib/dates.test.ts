import { formatRange, isoWeekday, presetRange } from "./dates";
import { describe, expect, it } from "vitest";

describe("presetRange", () => {
  const monday = "2026-10-19";

  it("uses the Zurich examples for Monday 19 October 2026", () => {
    expect(isoWeekday(monday)).toBe(1);
    expect(formatRange(presetRange("today", monday))).toBe("19.10.");
    expect(formatRange(presetRange("tomorrow", monday))).toBe("20.10.");
    expect(formatRange(presetRange("thisWeek", monday))).toBe("19.10.–25.10.");
    expect(formatRange(presetRange("thisWeekend", monday))).toBe("23.10.–25.10.");
    expect(formatRange(presetRange("nextWeek", monday))).toBe("26.10.–01.11.");
    expect(formatRange(presetRange("nextMonth", monday))).toBe("01.11.–30.11.");
  });

  it("starts this week today and keeps the weekend inside the same Sunday", () => {
    expect(formatRange(presetRange("thisWeek", "2026-10-21"))).toBe("21.10.–25.10.");
    expect(formatRange(presetRange("thisWeekend", "2026-10-21"))).toBe("23.10.–25.10.");
    expect(formatRange(presetRange("nextWeek", "2026-10-21"))).toBe("26.10.–01.11.");
    expect(formatRange(presetRange("thisWeek", "2026-10-24"))).toBe("24.10.–25.10.");
    expect(formatRange(presetRange("thisWeekend", "2026-10-24"))).toBe("24.10.–25.10.");
    expect(formatRange(presetRange("thisWeek", "2026-10-25"))).toBe("25.10.");
    expect(formatRange(presetRange("thisWeekend", "2026-10-25"))).toBe("25.10.");
    expect(formatRange(presetRange("nextWeek", "2026-10-25"))).toBe("26.10.–01.11.");
  });

  it("takes the whole next calendar month, including a year boundary and a leap February", () => {
    expect(presetRange("nextMonth", "2026-12-15")).toEqual({ from: "2027-01-01", to: "2027-01-31" });
    expect(presetRange("nextMonth", "2028-01-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
});
