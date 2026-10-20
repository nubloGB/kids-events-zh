import { buildIcs, calendarDates, calendarSpan, googleCalendarUrl } from "./calendar";
import type { KidsEvent } from "../types";
import { describe, expect, it } from "vitest";

function sample(overrides: Partial<KidsEvent>): KidsEvent {
  return {
    dateText: "sob. 17.10.2026, 10:15–11:45",
    startDate: "2026-10-17",
    title: "Family Literacy",
    url: "https://example.com/literacy",
    description: "Czytanie.",
    age: "2–5 lat",
    ageMin: 2,
    ageMax: 5,
    place: "PBZ Oerlikon",
    area: "Oerlikon",
    category: "biblioteka",
    registration: "brak info",
    isNew: false,
    tags: [],
    lat: 47.41,
    lng: 8.54,
    image: "images/fallback-books.jpg",
    ...overrides,
  };
}

describe("calendarSpan", () => {
  it("keeps a single day with one time range in the Zurich local clock", () => {
    const span = calendarSpan(sample({}), "2026-10-19");
    expect(span.allDay).toBe(false);
    expect(calendarDates(span)).toBe("20261017T101500/20261017T114500");
  });

  it("treats one clock time as a one-hour visit and an approximate end as a real end", () => {
    expect(calendarDates(calendarSpan(sample({ dateText: "sob. 7.11.2026, 14:30", startDate: "2026-11-07" }), "2026-10-19"))).toBe(
      "20261107T143000/20261107T153000",
    );
    expect(
      calendarDates(
        calendarSpan(sample({ dateText: "sob. 31.10.2026, 16:00–ok. 21:00", startDate: "2026-10-31" }), "2026-10-19"),
      ),
    ).toBe("20261031T160000/20261031T210000");
  });

  it("uses an all-day span when the event covers more than one date", () => {
    const span = calendarSpan(
      sample({
        dateText: "wtorki 9:30–10:30 (od 20.10.2026, kurs 8 spotkań)",
        startDate: "2026-10-20",
        endDate: "2026-12-08",
      }),
      "2026-10-19",
    );
    expect(span.allDay).toBe(true);
    expect(calendarDates(span)).toBe("20261020/20261209");
  });

  it("uses an all-day span when several different times are listed", () => {
    const span = calendarSpan(
      sample({ dateText: "ndz. 1.11.2026, 11:15 i 14:15", startDate: "2026-11-01" }),
      "2026-10-19",
    );
    expect(calendarDates(span)).toBe("20261101/20261102");
  });

  it("puts a recurring class on today and names the Zurich zone in both exports", () => {
    const event = sample({
      dateText: "piątki 14:00–15:45 (stale)",
      startDate: null,
      endDate: null,
      category: "stałe",
      title: "Otwarta stajnia",
    });
    expect(calendarDates(calendarSpan(event, "2026-10-19"))).toBe("20261019T140000/20261019T154500");
    const google = googleCalendarUrl(event, "2026-10-19");
    expect(google).toContain("ctz=Europe%2FZurich");
    expect(google).toContain("action=TEMPLATE");
    expect(decodeURIComponent(google)).toContain(event.url);
    const ics = buildIcs(event, "2026-10-19", new Date("2026-10-19T08:00:00Z"));
    expect(ics).toContain("TZID:Europe/Zurich");
    expect(ics).toContain("DTSTART;TZID=Europe/Zurich:20261019T140000");
    expect(ics).toContain("DTEND;TZID=Europe/Zurich:20261019T154500");
  });
});
