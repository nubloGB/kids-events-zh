import { existsSync, readFileSync } from "node:fs";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  eventInCategory,
  filtersAreActive,
  includesToday,
  inferRecurrence,
  isInsideBounds,
  isPast,
  parseEventsFile,
  partitionEvents,
  recurrenceOf,
  visibleHighlights,
  zurichToday,
} from "./events";
import { categoryAppearance, eventCategoryMarks } from "./markers";
import { ageRange } from "./age";
import { fold } from "./text";
import { describe, expect, it } from "vitest";

const file = parseEventsFile(JSON.parse(readFileSync("public/events.json", "utf8")));
/** Catalog checks that should see both one-day and recurring listings. */
const ALL_EVENTS = { ...EMPTY_FILTERS, recurrence: "all" as const };

describe("zurichToday", () => {
  it("uses the Zurich calendar around midnight UTC", () => {
    expect(zurichToday(new Date("2026-10-17T22:30:00Z"))).toBe("2026-10-18");
    expect(zurichToday(new Date("2026-10-17T20:30:00Z"))).toBe("2026-10-17");
  });
});

describe("events.json", () => {
  it("is the 22 November 2026 update", () => {
    expect(file.updatedAt).toBe("2026-11-22");
    expect(file.events).toHaveLength(509);
    expect(file.categories.some((category) => category.id === "swieta" && category.label === "Święta")).toBe(true);
    const swieta = file.events.filter((event) => eventInCategory(event, "swieta"));
    expect(swieta.length).toBeGreaterThan(40);
    expect(swieta.some((event) => event.title === "Samichlaus-Umzug")).toBe(true);
    expect(swieta.some((event) => event.title.startsWith("Circus Conelli"))).toBe(false);
    expect(file.events.some((event) => event.title === "Samichlausumzug Zürich")).toBe(false);
    expect(categoryAppearance("swieta").icon).toBe("🎄");
    expect(categoryAppearance("nieznana").icon).toBe("📍");
    expect(categoryAppearance("warsztaty").icon).toBe("🎨");
    expect(categoryAppearance("biblioteka").icon).toBe("📚");
    expect(categoryAppearance("campy/ferie").icon).toBe("🏕️");
    const both = eventCategoryMarks({ category: "festyny", tags: ["swieta"] });
    expect(both.map((mark) => mark.icon)).toEqual(["🎄", "🎈"]);
    expect(eventCategoryMarks({ category: "sport", tags: [] }).map((mark) => mark.icon)).toEqual(["⚽"]);
    expect(eventCategoryMarks({ category: "brak", tags: [] })[0]?.icon).toBe("📍");
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
    expect(file.highlights).toEqual([]);
  });

  it("hides an event the morning after its last day", () => {
    expect(file.events.filter((event) => isPast(event, "2026-11-21"))).toEqual([]);
    const candles = file.events.find((event) => event.title === "Hegemer Kerzenziehen");
    expect(candles && includesToday(candles, "2026-11-22")).toBe(true);
    expect(candles && isPast(candles, "2026-11-22")).toBe(false);
    expect(candles && isPast(candles, "2026-11-23")).toBe(true);
  });

  it("sorts dated events ascending and parks recurring ones apart", () => {
    const { upcoming, recurring } = partitionEvents(file.events, "2026-10-18", ALL_EVENTS);
    const dates = upcoming.map((event) => event.startDate ?? "");
    expect(dates).toEqual([...dates].sort());
    const sample = file.events.find((event) => event.startDate);
    expect(sample).toBeDefined();
    const later = { ...sample!, startDate: "2026-11-22", dateText: "ndz. 22.11.2026, 15:00", title: "Później" };
    const early = { ...sample!, startDate: "2026-11-22", dateText: "ndz. 22.11.2026, 9:00", title: "Rano" };
    const timeless = { ...sample!, startDate: "2026-11-22", dateText: "ndz. 22.11.2026", title: "Bez godziny" };
    expect(partitionEvents([later, timeless, early], "2026-11-22", ALL_EVENTS).upcoming.map((event) => event.title)).toEqual([
      "Rano",
      "Później",
      "Bez godziny",
    ]);
    expect(upcoming.some((event) => event.title === "Oerliker Singmüüs")).toBe(true);
    expect(recurring.map((event) => event.title)).toContain("Zoo Zürich");
    expect(recurring.every((event) => event.startDate === null && event.category === "stałe")).toBe(true);
  });

  it("filters by area, category, age and folded text", () => {
    const winterthur = partitionEvents(file.events, "2026-10-18", {
      ...ALL_EVENTS,
      areas: ["Winterthur"],
    });
    expect(winterthur.upcoming.every((event) => event.area === "Winterthur")).toBe(true);
    expect(winterthur.upcoming.length + winterthur.recurring.length).toBeGreaterThan(0);

    const theatre = partitionEvents(file.events, "2026-10-18", {
      ...ALL_EVENTS,
      categories: ["teatr"],
    });
    expect(theatre.upcoming.every((event) => event.category === "teatr")).toBe(true);
    expect(theatre.recurring).toHaveLength(0);

    const toddlers = partitionEvents(file.events, "2026-10-18", { ...ALL_EVENTS, age: "under3" });
    expect(toddlers.upcoming.some((event) => event.title.includes("Skoki do wody"))).toBe(false);
    expect(toddlers.upcoming.some((event) => event.title.startsWith("Oerliker Singmüüs"))).toBe(true);
    expect(toddlers.upcoming.some((event) => event.age === "2–5 l.")).toBe(true);

    const older = partitionEvents(file.events, "2026-10-18", { ...ALL_EVENTS, age: "over3" });
    expect(older.upcoming.some((event) => event.title.includes("Skoki do wody"))).toBe(true);
    expect(older.upcoming.every((event) => event.ageMin === null || event.ageMax === null || event.ageMax >= 3)).toBe(
      true,
    );

    const search = partitionEvents(file.events, "2026-10-18", {
      ...ALL_EVENTS,
      query: "lyzw",
    });
    expect(search.upcoming.map((event) => event.title)).toContain("Łyżwiarstwo (Sportamt)");
    expect(fold("Łyżwy")).toBe("lyzwy");
    expect(filtersAreActive({ ...EMPTY_FILTERS, query: "zoo" })).toBe(true);
    expect(filtersAreActive({ ...EMPTY_FILTERS, date: { kind: "today" } })).toBe(false);
    expect(filtersAreActive(EMPTY_FILTERS)).toBe(true);
    expect(filtersAreActive({ ...EMPTY_FILTERS, date: { kind: "tomorrow" } })).toBe(true);
    expect(filtersAreActive({ ...EMPTY_FILTERS, tags: ["halloween"] })).toBe(true);
    expect(filtersAreActive({ ...EMPTY_FILTERS, recurrence: "recurring" })).toBe(true);
    expect(filtersAreActive({ ...EMPTY_FILTERS, recurrence: "all" })).toBe(true);
    const todayDefault = { ...EMPTY_FILTERS, date: { kind: "today" as const } };
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount(todayDefault)).toBe(0);
    expect(activeFilterCount({ ...todayDefault, query: "zoo" })).toBe(0);
    expect(activeFilterCount({ ...todayDefault, recurrence: "single" })).toBe(0);
    expect(activeFilterCount({ ...todayDefault, recurrence: "recurring" })).toBe(1);
    expect(activeFilterCount({ ...todayDefault, recurrence: "all" })).toBe(1);
    expect(activeFilterCount(todayDefault, true)).toBe(1);
    expect(
      activeFilterCount({
        ...EMPTY_FILTERS,
        areas: ["Oerlikon", "Zurych"],
        age: "under3",
        tags: ["halloween"],
        date: { kind: "today" },
      }),
    ).toBe(4);
    expect(activeFilterCount({ ...EMPTY_FILTERS, date: { kind: "all" } })).toBe(0);
    expect(activeFilterCount({ ...todayDefault, date: { kind: "rollingWeek" } })).toBe(0);
    expect(activeFilterCount({ ...todayDefault, date: { kind: "tomorrow" } })).toBe(0);
  });

  it("shows a highlight only while its date is open and a live event carries the tag", () => {
    const jarmark = { tag: "jarmark", label: "Jarmark", until: "2026-12-24" };
    const halloween = { tag: "halloween", label: "Halloween", until: "2026-10-31" };
    const mikolaj = { tag: "mikolaj", label: "Mikołaj", until: "2026-12-06" };
    const live = { startDate: "2026-12-06", endDate: "2026-12-06", tags: ["jarmark"] };
    const past = { startDate: "2026-11-01", endDate: "2026-11-01", tags: ["jarmark"] };
    const always = { startDate: null, endDate: null, tags: ["halloween"] };
    expect(visibleHighlights([jarmark, halloween, mikolaj], [past], "2026-11-22")).toEqual([]);
    expect(visibleHighlights([jarmark, halloween, mikolaj], [live], "2026-11-22")).toEqual([jarmark]);
    expect(visibleHighlights([jarmark], [live], "2026-12-25")).toEqual([]);
    expect(visibleHighlights([halloween], [always], "2026-11-22")).toEqual([]);
    expect(visibleHighlights([{ ...halloween, until: "2026-11-22" }], [always], "2026-11-22")).toEqual([
      { ...halloween, until: "2026-11-22" },
    ]);
    expect(visibleHighlights([mikolaj], [always], "2026-11-22")).toEqual([]);

    const raw = JSON.parse(readFileSync("public/events.json", "utf8")) as { highlights?: unknown };
    raw.highlights = [{ tag: "jarmark", label: "Jarmark" }];
    expect(() => parseEventsFile(raw)).toThrow(/until/);
  });

  it("treats theme tags as an optional filter", () => {
    const halloween = partitionEvents(file.events, "2026-11-21", { ...ALL_EVENTS, tags: ["halloween"] });
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
    const week = partitionEvents(file.events, "2026-11-21", { ...ALL_EVENTS, date: { kind: "thisWeek" } });
    expect(week.upcoming.some((event) => event.title.startsWith("Die Zauberorgel"))).toBe(true);
    expect(week.upcoming.some((event) => event.title.startsWith("WunderBär"))).toBe(false);
    expect(week.recurring).toHaveLength(0);

    const nextWeek = partitionEvents(file.events, "2026-11-21", { ...ALL_EVENTS, date: { kind: "nextWeek" } });
    expect(nextWeek.upcoming.some((event) => event.title.includes("Weihnachtstanne"))).toBe(true);
    expect(nextWeek.upcoming.some((event) => event.title.startsWith("Mario Kart"))).toBe(true);
    expect(nextWeek.upcoming.some((event) => event.title.includes("Zeitfresser"))).toBe(false);

    const nextMonth = partitionEvents(file.events, "2026-11-21", { ...ALL_EVENTS, date: { kind: "nextMonth" } });
    expect(nextMonth.upcoming.some((event) => event.title.includes("Samichlaus"))).toBe(true);
    expect(nextMonth.upcoming.some((event) => event.title.startsWith("Hegemer"))).toBe(false);

    const custom = partitionEvents(file.events, "2026-11-21", {
      ...ALL_EVENTS,
      date: { kind: "custom", from: "2026-11-28", to: "2026-11-28" },
    });
    expect(custom.upcoming.some((event) => event.title.startsWith("Mario Kart"))).toBe(true);
    expect(custom.upcoming.some((event) => event.title.startsWith("Hegemer"))).toBe(false);
    expect(custom.upcoming.some((event) => (event.endDate || event.startDate || "") < "2026-11-28" && (event.startDate || "") > "2026-11-28")).toBe(false);
  });

  it("gives every event a Swiss coordinate and a committed image", () => {
    for (const event of file.events) {
      expect(event.lat).toBeGreaterThan(45.8);
      expect(event.lat).toBeLessThan(48.5);
      expect(event.lng).toBeGreaterThan(5.9);
      expect(event.lng).toBeLessThan(10.6);
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

describe("recurrence", () => {
  it("stores single or recurring on every event and matches the date heuristic", () => {
    const single = file.events.filter((event) => event.recurrence === "single");
    const recurring = file.events.filter((event) => event.recurrence === "recurring");
    expect(single.length + recurring.length).toBe(file.events.length);
    for (const event of file.events) {
      expect(event.recurrence).toBe(inferRecurrence(event));
    }
    expect(single.map((event) => event.title)).toEqual(
      expect.arrayContaining(["Mario Kart Live", "TSG Nipper Race", "Familienkonzert: Bilder einer Ausstellung"]),
    );
    expect(recurring.map((event) => event.title)).toEqual(
      expect.arrayContaining(["Zoo Zürich", "Oerliker Singmüüs", "Offenes Atelier für Alle", "Die Zauberorgel (Zürcher Märchenbühne)"]),
    );
  });

  it("defaults to one-day events and can show recurring or everything", () => {
    const oneDay = partitionEvents(file.events, "2026-11-21", EMPTY_FILTERS);
    const shown = [...oneDay.upcoming, ...oneDay.recurring];
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((event) => event.recurrence === "single")).toBe(true);
    expect(oneDay.recurring).toHaveLength(0);
    expect(oneDay.upcoming.some((event) => event.title === "Mario Kart Live")).toBe(true);
    expect(shown.some((event) => event.title === "Zoo Zürich" || event.title === "Oerliker Singmüüs")).toBe(false);

    const cyclic = partitionEvents(file.events, "2026-11-21", { ...EMPTY_FILTERS, recurrence: "recurring" });
    const cyclicShown = [...cyclic.upcoming, ...cyclic.recurring];
    expect(cyclicShown.every((event) => event.recurrence === "recurring")).toBe(true);
    expect(cyclic.recurring.some((event) => event.title === "Zoo Zürich")).toBe(true);
    expect(cyclic.upcoming.some((event) => event.title.startsWith("Die Zauberorgel"))).toBe(true);
    expect(cyclicShown.some((event) => event.title === "Mario Kart Live")).toBe(false);

    const all = partitionEvents(file.events, "2026-11-21", ALL_EVENTS);
    expect(all.upcoming.length + all.recurring.length).toBe(oneDay.upcoming.length + cyclicShown.length);
  });

  it("infers a kind when the field is missing and rejects a file that omits it", () => {
    const mario = file.events.find((event) => event.title === "Mario Kart Live");
    expect(mario).toBeDefined();
    const withoutField = { ...mario! };
    delete withoutField.recurrence;
    expect(recurrenceOf(withoutField)).toBe("single");
    expect(
      inferRecurrence({
        dateText: "13.–22.11.2026, 14:00",
        startDate: "2026-11-13",
        description: "Wystawa.",
      }),
    ).toBe("recurring");
    expect(
      inferRecurrence({
        dateText: "ndz. 22.11.2026, 14:00",
        startDate: "2026-11-22",
        description: "Otwarte atelier w każdą niedzielę.",
      }),
    ).toBe("recurring");
    expect(
      inferRecurrence({
        dateText: "ndz. 10.1.2027, 11:15 i 14:15",
        startDate: "2027-01-10",
        description: "Dwa seanse tego samego dnia.",
      }),
    ).toBe("single");

    const raw = JSON.parse(readFileSync("public/events.json", "utf8")) as {
      updatedAt: string;
      events: { recurrence?: string }[];
    };
    delete raw.events[0]?.recurrence;
    expect(() => parseEventsFile(raw)).toThrow(/recurrence/);
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
      "Otwarte hale i lód, zima 2026/27",
    ]);
    const links = sources.sections.flatMap((section) => section.items.flatMap((item) => item.links));
    expect(links.length).toBeGreaterThan(30);
    expect(links.every((link) => /^https?:\/\//.test(link.url))).toBe(true);
    expect(sources.sections[3]?.items[0]?.name).toContain("PLATZ");
  });
});
