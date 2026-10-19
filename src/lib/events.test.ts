import { readFileSync } from "node:fs";
import {
  EMPTY_FILTERS,
  filtersAreActive,
  includesToday,
  isPast,
  parseEventsFile,
  partitionEvents,
  zurichToday,
} from "./events";
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
  it("keeps the 17 October snapshot and every listing", () => {
    expect(file.updatedAt).toBe("2026-10-17");
    expect(file.events).toHaveLength(67);
    expect(file.events.filter((event) => event.isNew).map((event) => event.title)).toEqual([
      "Räbeliächtli – PLATZ",
      "Adventsfenster i zakończenie roku – PLATZ",
      "Zimowanie PLATZ (Einwintern)",
      "PLATZ – otwarty plac przygód",
      "Opowieści w jurcie – PLATZ",
      "Joga dla dzieci w jurcie – PLATZ",
    ]);
  });

  it("hides only the two showings from 17 October on the following day", () => {
    const hidden = file.events.filter((event) => isPast(event, "2026-10-18")).map((event) => event.title);
    expect(hidden).toEqual([
      "Geschichtenfenster – Landesmuseum",
      "Family Literacy po japońsku (PBZ)",
    ]);
    const today = file.events.find((event) => event.title.startsWith("Familientag"));
    expect(today && includesToday(today, "2026-10-18")).toBe(true);
  });

  it("sorts dated events ascending and parks recurring ones apart", () => {
    const { upcoming, recurring } = partitionEvents(file.events, "2026-10-18", EMPTY_FILTERS);
    const dates = upcoming.map((event) => event.startDate ?? "");
    expect(dates).toEqual([...dates].sort());
    expect(upcoming[0]?.title).toBe("Familientag Landesmuseum");
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

    const toddlers = partitionEvents(file.events, "2026-10-18", { ...EMPTY_FILTERS, age: 2 });
    expect(toddlers.upcoming.some((event) => event.title.includes("Skoki do wody"))).toBe(false);
    expect(toddlers.upcoming.some((event) => event.title.startsWith("Familientag"))).toBe(true);

    const search = partitionEvents(file.events, "2026-10-18", {
      ...EMPTY_FILTERS,
      query: "lyzw",
    });
    expect(search.upcoming.map((event) => event.title)).toContain("Łyżwiarstwo (Sportamt)");
    expect(fold("Łyżwy")).toBe("lyzwy");
    expect(filtersAreActive({ ...EMPTY_FILTERS, query: "zoo" })).toBe(true);
    expect(filtersAreActive(EMPTY_FILTERS)).toBe(false);
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
