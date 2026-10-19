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

  it("gives every event a Swiss coordinate and a committed image", () => {
    for (const event of file.events) {
      expect(event.lat).toBeGreaterThan(47.2);
      expect(event.lat).toBeLessThan(47.6);
      expect(event.lng).toBeGreaterThan(8.4);
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
