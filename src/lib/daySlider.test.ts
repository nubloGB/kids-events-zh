import { dateForSliderStop, ownRangeLabel, sliderBubble, sliderStopFor } from "./daySlider";
import { presetRange, resolveDateRange, zurichToday } from "./dates";
import { describe, expect, it } from "vitest";

describe("day slider stops", () => {
  it("maps the six stops onto the shared date filter", () => {
    expect(dateForSliderStop("today")).toEqual({ kind: "today" });
    expect(dateForSliderStop("tomorrow")).toEqual({ kind: "tomorrow" });
    expect(dateForSliderStop("weekend")).toEqual({ kind: "thisWeekend" });
    expect(dateForSliderStop("week")).toEqual({ kind: "rollingWeek" });
    expect(dateForSliderStop("month")).toEqual({ kind: "rollingMonth" });
    expect(dateForSliderStop("all")).toEqual({ kind: "all" });
    expect(sliderStopFor({ kind: "thisWeekend" })).toBe("weekend");
    expect(sliderStopFor({ kind: "custom", from: "2026-12-12", to: "2026-12-18" })).toBeNull();
    expect(sliderStopFor({ kind: "thisWeek" })).toBeNull();
  });

  it("keeps Weekend, midnight, the time zone, Miesiąc and Wszystkie", () => {
    const justAfterMidnight = new Date("2026-11-21T23:00:00Z");
    const today = zurichToday(justAfterMidnight);
    expect(today).toBe("2026-11-22");
    expect(zurichToday(new Date("2026-11-21T22:30:00Z"))).toBe("2026-11-21");
    expect(presetRange("thisWeekend", today)).toEqual({ from: "2026-11-28", to: "2026-11-29" });
    expect(presetRange("rollingMonth", today)).toEqual({ from: "2026-11-22", to: "2026-12-22" });
    expect(resolveDateRange({ kind: "all" }, today)).toBeNull();
    expect(justAfterMidnight.toISOString().slice(0, 10)).toBe("2026-11-21");
  });

  it("formats a custom range as Własny and a single-day bubble", () => {
    expect(ownRangeLabel("2026-12-12", "2026-12-18")).toBe("Własny: 12–18.12");
    expect(ownRangeLabel("2026-11-28", "2026-12-04")).toBe("Własny: 28.11–4.12");
    expect(sliderBubble({ kind: "today" }, "2026-11-22", 4)).toBe("Dziś, ndz. 22.11 · 4 wydarzenia");
    expect(sliderBubble({ kind: "rollingWeek" }, "2026-11-22", 3)).toBe("Tydzień, ndz. 22.11–sb 28.11 · 3 wydarzenia");
    expect(sliderBubble({ kind: "all" }, "2026-11-22", 5)).toBe("Wszystkie · 5 wydarzeń");
    expect(sliderBubble({ kind: "custom", from: "2026-12-12", to: "2026-12-18" }, "2026-11-22", 1)).toBe(
      "Własny: 12–18.12 · 1 wydarzenie",
    );
  });
});
