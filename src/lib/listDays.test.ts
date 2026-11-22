import { dayHeaderLabel, eventStartMinutes, formatClock, groupByDay } from "./listDays";
import { describe, expect, it } from "vitest";

describe("day groups", () => {
  it("sorts a day by time and drops events without a clock to the end", () => {
    const grouped = groupByDay([
      { startDate: "2026-11-22", dateText: "ndz. 22.11.2026, 15:00–16:00", title: "Później" },
      { startDate: "2026-11-22", dateText: "ndz. 22.11.2026", title: "Bez godziny" },
      { startDate: "2026-11-22", dateText: "ndz. 22.11.2026, 9:00–13:00", title: "Rano" },
      { startDate: "2026-11-23", dateText: "pn. 23.11.2026, 11:00", title: "Jutro" },
      { startDate: null, dateText: "stale", title: "Zoo" },
    ]);
    expect(grouped.days.map((day) => day.iso)).toEqual(["2026-11-22", "2026-11-23"]);
    expect(grouped.days[0]?.events.map((event) => event.title)).toEqual(["Rano", "Później", "Bez godziny"]);
    expect(grouped.undated.map((event) => event.title)).toEqual(["Zoo"]);
    expect(formatClock("ndz. 22.11.2026, 9:00–13:00")).toBe("9:00");
    expect(eventStartMinutes("bez godziny")).toBeNull();
    expect(dayHeaderLabel("2026-11-22", "2026-11-22", 4)).toBe("Dziś · ndz. 22.11 · 4 wydarzenia");
    expect(dayHeaderLabel("2026-11-23", "2026-11-22", 1)).toBe("Jutro · pn 23.11 · 1 wydarzenie");
    expect(dayHeaderLabel("2026-11-25", "2026-11-22", 2)).toBe("Środa · śr 25.11 · 2 wydarzenia");
  });
});
