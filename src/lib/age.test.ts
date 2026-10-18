import { ageRange, matchesAge } from "./age";
import { describe, expect, it } from "vitest";

describe("ageRange", () => {
  it("reads explicit age spans, including the word lata", () => {
    expect(ageRange("2–5 lat", "2026-10-17")).toEqual({ min: 2, max: 5 });
    expect(ageRange("1–4 lata", "2026-10-20")).toEqual({ min: 1, max: 4 });
    expect(ageRange("ok. 4–8 lat", "2026-10-25")).toEqual({ min: 4, max: 8 });
    expect(ageRange("od 4 lat z opiekunem", "2026-10-17")).toEqual({ min: 4, max: null });
    expect(ageRange("do 10 lat z opiekunem", "2026-11-04")).toEqual({ min: 0, max: 10 });
    expect(ageRange("dzieci do 7 lat z opiekunem", "2026-11-07")).toEqual({ min: 0, max: 7 });
    expect(ageRange("od ok. 2 lat (rodzic z dzieckiem) do 8 lat", "2026-12-13")).toEqual({
      min: 2,
      max: 8,
    });
  });

  it("converts birth-year cohorts using the event year", () => {
    expect(ageRange("roczniki 2018–2020", "2026-10-20")).toEqual({ min: 6, max: 8 });
    expect(ageRange("roczniki 2018–2020", "2027-03-06")).toEqual({ min: 7, max: 9 });
    expect(ageRange("roczniki 2019–2021 (śr.), 2019–2020 (wt./czw.)", "2026-10-20")).toEqual({
      min: 5,
      max: 7,
    });
    expect(ageRange("U10: roczniki 2018–2020 (drużyny 6-osobowe)", "2026-12-05")).toEqual({
      min: 6,
      max: 8,
    });
    expect(ageRange("kategorie 3–6 lat (roczniki 2020–2023) i 7–10 lat", "2026-12-31")).toEqual({
      min: 3,
      max: 10,
    });
  });

  it("treats families and missing ages as every age", () => {
    expect(ageRange("rodziny", "2026-10-18")).toBeNull();
    expect(ageRange("brak info o wieku", "2026-10-24")).toBeNull();
    expect(ageRange("wszyscy (do 7 lat z opiekunem)", "2026-10-21")).toBeNull();
    expect(ageRange("wszystkie dzieci", null)).toBeNull();
    expect(ageRange("dzieci (dokładny wiek: brak info)", null)).toBeNull();
  });

  it("covers school and preschool phrases", () => {
    expect(ageRange("uczniowie szkoły podstawowej", null)).toEqual({ min: 6, max: 12 });
    expect(ageRange("od przedszkola, mieszkańcy Zurychu", "2027-02-15")).toEqual({
      min: 4,
      max: null,
    });
    expect(ageRange("najmłodsi", null)).toEqual({ min: 2, max: 5 });
  });
});

describe("matchesAge", () => {
  it("keeps open-ended and family events available to the chosen age", () => {
    expect(matchesAge("od 4 lat", 3, "2026-10-17")).toBe(false);
    expect(matchesAge("od 4 lat", 4, "2026-10-17")).toBe(true);
    expect(matchesAge("od 4 lat", 8, "2026-10-17")).toBe(true);
    expect(matchesAge("2–5 lat", 6, "2026-10-17")).toBe(false);
    expect(matchesAge("rodziny", 2, "2026-10-18")).toBe(true);
  });
});
