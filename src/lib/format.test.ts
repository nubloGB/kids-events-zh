import { describe, expect, it } from "vitest";
import { countLabel, formatPolishShortDate } from "./format";

describe("formatPolishShortDate", () => {
  it("keeps the calendar day from updatedAt", () => {
    expect(formatPolishShortDate("2026-11-21")).toBe("21.11.2026");
  });
});

describe("countLabel", () => {
  it("uses Polish plural forms for wydarzenia", () => {
    const label = (count: number) => countLabel(count, "wydarzenie", "wydarzenia", "wydarzeń");
    expect(label(1)).toBe("1 wydarzenie");
    expect(label(2)).toBe("2 wydarzenia");
    expect(label(4)).toBe("4 wydarzenia");
    expect(label(5)).toBe("5 wydarzeń");
    expect(label(12)).toBe("12 wydarzeń");
    expect(label(14)).toBe("14 wydarzeń");
    expect(label(22)).toBe("22 wydarzenia");
    expect(label(24)).toBe("24 wydarzenia");
  });
});
