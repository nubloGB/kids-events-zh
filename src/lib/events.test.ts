import { existsSync, readFileSync } from "node:fs";
import {
  EMPTY_FILTERS,
  filtersAreActive,
  includesToday,
  isInsideBounds,
  isPast,
  parseEventsFile,
  partitionEvents,
  zurichToday,
} from "./events";
import { ageRange } from "./age";
import { fold } from "./text";
import { describe, expect, it } from "vitest";

const file = parseEventsFile(JSON.parse(readFileSync("public/events.json", "utf8")));

describe("zurichToday", () => {
  it("uses the Zurich calendar around midnight UTC", () => {
    expect(zurichToday(new Date("2026-10-17T22:30:00Z"))).toBe("2026-10-18");
    expect(zurichToday(new Date("2026-10-17T20:30:00Z"))).toBe("2026-10-17");
  });
});

describe("events.json", () => {
  it("is the 21 November 2026 update", () => {
    expect(file.updatedAt).toBe("2026-11-21");
    expect(file.events).toHaveLength(188);
    const fresh = file.events.filter((event) => event.isNew).map((event) => event.title);
    expect(fresh).toEqual(expect.arrayContaining([
      "SonntagzOerlikon",
      "Die Zauberorgel (Zürcher Märchenbühne)",
      "WunderBär! (Musikkollegium Winterthur)",
      "MiniMove Buhnrain",
      "Weihnachten & Krippen (Landesmuseum)",
      "Mario Kart Live",
    ]));
    expect(file.events.every((event) => Array.isArray(event.tags))).toBe(true);
    expect(file.events.some((event) => event.title.startsWith("Halloween"))).toBe(false);
  });

  it("hides an event the morning after its last day", () => {
    expect(file.events.filter((event) => isPast(event, "2026-11-21"))).toEqual([]);
    const candles = file.events.find((event) => event.title === "Hegemer Kerzenziehen");
    expect(candles && includesToday(candles, "2026-11-22")).toBe(true);
    expect(candles && isPast(candles, "2026-11-22")).toBe(false);
    expect(candles && isPast(candles, "2026-11-23")).toBe(true);
  });

  it("sorts dated events ascending and parks recurring ones apart", () => {
    const { upcoming, recurring } = partitionEvents(file.events, "2026-10-18", EMPTY_FILTERS);
    const dates = upcoming.map((event) => event.startDate ?? "");
    expect(dates).toEqual([...dates].sort());
    expect(upcoming.some((event) => event.title === "Oerliker Singmüüs")).toBe(true);
    expect(recurring.map((event) => event.title)).toContain("Zoo Zürich");
    expect(recurring.every((event) => event.startDate === null && event.category === "stałe")).toBe(true);
  });

  it("filters by area, category, age and folded text", () => {
    const winterthur = partitionEvents(file.events, "2026-10-18", {
      ...EMPTY_FILTERS,
      areas: ["Winterthur"],
    });
    expect(winterthur.upcoming.every((event) => event.area === "Winterthur")).toBe(true);
    expect(winterthur.upcoming.length + winterthur.recurring.length).toBeGreaterThan(0);

    const theatre = partitionEvents(file.events, "2026-10-18", {
      ...EMPTY_FILTERS,
      categories: ["teatr"],
    });
    expect(theatre.upcoming.every((event) => event.category === "teatr")).toBe(true);
    expect(theatre.recurring).toHaveLength(0);

    const toddlers = partitionEvents(file.events, "2026-10-18", { ...EMPTY_FILTERS, age: "under3" });
    expect(toddlers.upcoming.some((event) => event.title.includes("Skoki do wody"))).toBe(false);
    expect(toddlers.upcoming.some((event) => event.title.startsWith("Oerliker Singmüüs"))).toBe(true);
    expect(toddlers.upcoming.some((event) => event.age === "2–5 lat")).toBe(true);

    const older = partitionEvents(file.events, "2026-10-18", { ...EMPTY_FILTERS, age: "over3" });
    expect(older.upcoming.some((event) => event.title.includes("Skoki do wody"))).toBe(true);
    expect(older.upcoming.every((event) => event.ageMin === null || event.ageMax === null || event.ageMax >= 3)).toBe(
      true,
    );

    const search = partitionEvents(file.events, "2026-10-18", {
      ...EMPTY_FILTERS,
      query: "lyzw",
    });
    expect(search.upcoming.map((event) => event.title)).toContain("Łyżwiarstwo (Sportamt)");
    expect(fold("Łyżwy")).toBe("lyzwy");
    expect(filtersAreActive({ ...EMPTY_FILTERS, query: "zoo" })).toBe(true);
    expect(filtersAreActive(EMPTY_FILTERS)).toBe(false);
    expect(filtersAreActive({ ...EMPTY_FILTERS, date: { kind: "today" } })).toBe(true);
    expect(filtersAreActive({ ...EMPTY_FILTERS, tags: ["halloween"] })).toBe(true);
  });

  it("treats theme tags as an optional filter", () => {
    const halloween = partitionEvents(file.events, "2026-11-21", { ...EMPTY_FILTERS, tags: ["halloween"] });
    const listed = [...halloween.upcoming, ...halloween.recurring];
    expect(listed).toEqual([]);
    expect(file.events.every((event) => !event.tags.includes("halloween"))).toBe(true);
  });

  it("keeps ageMin and ageMax aligned with the age text", () => {
    for (const event of file.events) {
      const range = ageRange(event.age, event.startDate);
      expect(event.ageMin).toBe(range ? range.min : null);
      expect(event.ageMax).toBe(range ? range.max : null);
    }
  });

  it("matches multi-day events when they overlap the chosen dates", () => {
    const week = partitionEvents(file.events, "2026-11-21", { ...EMPTY_FILTERS, date: { kind: "thisWeek" } });
    expect(week.upcoming.some((event) => event.title.startsWith("Die Zauberorgel"))).toBe(true);
    expect(week.upcoming.some((event) => event.title.startsWith("WunderBär"))).toBe(false);
    expect(week.recurring).toHaveLength(0);

    const nextWeek = partitionEvents(file.events, "2026-11-21", { ...EMPTY_FILTERS, date: { kind: "nextWeek" } });
    expect(nextWeek.upcoming.some((event) => event.title.includes("Weihnachtstanne"))).toBe(true);
    expect(nextWeek.upcoming.some((event) => event.title.startsWith("Mario Kart"))).toBe(true);
    expect(nextWeek.upcoming.some((event) => event.title.includes("Zeitfresser"))).toBe(false);

    const nextMonth = partitionEvents(file.events, "2026-11-21", { ...EMPTY_FILTERS, date: { kind: "nextMonth" } });
    expect(nextMonth.upcoming.some((event) => event.title.includes("Samichlaus"))).toBe(true);
    expect(nextMonth.upcoming.some((event) => event.title.startsWith("Hegemer"))).toBe(false);

    const custom = partitionEvents(file.events, "2026-11-21", {
      ...EMPTY_FILTERS,
      date: { kind: "custom", from: "2026-11-28", to: "2026-11-28" },
    });
    expect(custom.upcoming.some((event) => event.title.startsWith("Mario Kart"))).toBe(true);
    expect(custom.upcoming.some((event) => event.title.startsWith("Hegemer"))).toBe(false);
    expect(custom.upcoming.some((event) => (event.endDate || event.startDate || "") < "2026-11-28" && (event.startDate || "") > "2026-11-28")).toBe(false);
  });

  it("gives every event a Swiss coordinate and a committed image", () => {
    for (const event of file.events) {
      expect(event.lat).toBeGreaterThan(47.3);
      expect(event.lat).toBeLessThan(47.55);
      expect(event.lng).toBeGreaterThan(8.25);
      expect(event.lng).toBeLessThan(8.85);
      expect(event.image.startsWith("images/")).toBe(true);
      expect(existsSync(`public/${event.image}`)).toBe(true);
      expect(event.image).not.toBe("images/zoo.jpg");
    }
    const dance = file.events.find((event) => event.place === "Simply Theatre");
    expect(dance?.lat).toBeCloseTo(47.377782, 5);
    expect(dance?.lng).toBeCloseTo(8.558749, 5);
    const oerlikon = file.events.find((event) => event.place === "GZ Oerlikon");
    expect(
      oerlikon &&
        isInsideBounds(oerlikon, { south: 47.4, west: 8.53, north: 47.42, east: 8.56 }),
    ).toBe(true);
    expect(
      oerlikon &&
        isInsideBounds(oerlikon, { south: 47.42, west: 8.53, north: 47.43, east: 8.56 }),
    ).toBe(false);
  });
});

describe("sources.json", () => {
  it("keeps organizer links for the Źródła tab", () => {
    const sources = JSON.parse(readFileSync("public/sources.json", "utf8")) as {
      sections: { title: string; items: { name: string; links: { url: string }[] }[] }[];
    };
    expect(sources.sections.map((section) => section.title)).toEqual([
      "Organizatorzy kursów feryjnych Stadt Zürich (Herbst 2026)",
      "Sport dla dzieci i zoo",
      "Sport, ogród, zwierzęta",
      "Winterthur",
    ]);
    const links = sources.sections.flatMap((section) => section.items.flatMap((item) => item.links));
    expect(links.length).toBeGreaterThan(30);
    expect(links.every((link) => /^https?:\/\//.test(link.url))).toBe(true);
    expect(sources.sections[3]?.items[0]?.name).toContain("PLATZ");
  });
});
