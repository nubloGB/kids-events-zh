import { matchesAgeBand } from "./age";
import { compareEvents } from "./listDays";
import { resolveDateRange, rangesOverlap, zurichToday } from "./dates";
import { fold } from "./text";
import {
  AREAS,
  CATEGORIES,
  type Area,
  type Category,
  type EventFilters,
  type EventHighlight,
  type EventsFile,
  type KidsEvent,
  type MapBounds,
  type RecurrenceFilter,
} from "../types";

export { zurichToday };

export type Recurrence = Exclude<RecurrenceFilter, "all">;

const WEEKDAY_SERIES = /(?:poniedziałki|wtorki|środy|czwartki|piątki|soboty|niedziele)/i;
const RANGE_IN_DATES =
  /\d{1,2}\.\s*[–—-]\s*\d{1,2}\.|\d{1,2}\s*[–—-]\s*\d{1,2}\.\d{1,2}|\d{1,2}\.\d{1,2}\.\d{4}\s*[–—-]/;
const REGULAR_OFFER =
  /w każd[aąeę]\s+\p{L}+|co tydzień|cotygodni|co 2 tygodnie|co dwa tygodnie|codziennie|\bstale\b|1×\s*\/\s*mies|raz w miesiącu|\bsemestr\b/iu;

function distinctDayMonths(dateText: string): number {
  const found = new Set<string>();
  for (const match of dateText.matchAll(/(?:^|[^\d])(\d{1,2})\.(\d{1,2})(?!\d)/g)) {
    found.add(`${Number(match[1])}.${Number(match[2])}`);
  }
  return found.size;
}

/** Classify from dates and wording when an event has no `recurrence` field. */
export function inferRecurrence(event: {
  startDate: string | null;
  endDate?: string | null;
  dateText: string;
  description?: string;
}): Recurrence {
  if (event.startDate === null) return "recurring";
  const last = event.endDate || event.startDate;
  if (last > event.startDate) return "recurring";
  const dateText = event.dateText;
  const withoutAsides = dateText.replace(/\([^)]*\)/g, " ");
  if (
    WEEKDAY_SERIES.test(dateText) ||
    RANGE_IN_DATES.test(withoutAsides) ||
    distinctDayMonths(dateText) >= 2
  ) {
    return "recurring";
  }
  if (REGULAR_OFFER.test(`${dateText}\n${event.description ?? ""}`)) return "recurring";
  return "single";
}

export function recurrenceOf(event: KidsEvent): Recurrence {
  if (event.recurrence === "single" || event.recurrence === "recurring") return event.recurrence;
  return inferRecurrence(event);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isRecurring(event: KidsEvent): boolean {
  return event.startDate === null;
}

/** An event is past the morning after its last day, in the Zurich calendar. */
export function isPast(event: { startDate: string | null; endDate?: string | null }, today: string): boolean {
  if (!event.startDate) return false;
  const last = event.endDate || event.startDate;
  return last < today;
}

/**
 * Theme shortcuts that are still in date and match at least one event that has not ended.
 * An empty tag list, or a highlight whose `until` is already past, produces nothing.
 */
export function visibleHighlights(
  highlights: EventHighlight[],
  events: { startDate: string | null; endDate?: string | null; tags: string[] }[],
  today: string,
): EventHighlight[] {
  return highlights.filter((highlight) => {
    if (highlight.until < today) return false;
    return events.some((event) => !isPast(event, today) && event.tags.includes(highlight.tag));
  });
}

export function includesToday(event: KidsEvent, today: string): boolean {
  if (!event.startDate) return false;
  const last = event.endDate || event.startDate;
  return event.startDate <= today && today <= last;
}

function dateWindow(filters: EventFilters, today: string): { from: string; to: string } | null {
  return resolveDateRange(filters.date, today);
}

export function matchesFilters(event: KidsEvent, filters: EventFilters, today: string): boolean {
  if (filters.areas.length > 0 && !filters.areas.includes(event.area)) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(event.category)) return false;
  if (!matchesAgeBand(event.ageMin, event.ageMax, filters.age)) return false;
  const chosen = dateWindow(filters, today);
  if (chosen) {
    if (!event.startDate || !rangesOverlap(event.startDate, event.endDate || event.startDate, chosen)) return false;
  }
  if (filters.tags.length > 0 && !filters.tags.some((tag) => event.tags.includes(tag))) return false;
  if (filters.recurrence !== "all" && recurrenceOf(event) !== filters.recurrence) return false;
  const query = fold(filters.query).trim();
  if (!query) return true;
  const haystack = fold(
    [
      event.title,
      event.description,
      event.place,
      event.dateText,
      event.age,
      event.registration,
      event.area,
      event.category,
      ...event.tags,
    ].join(" "),
  );
  return haystack.includes(query);
}

function byDate(a: KidsEvent, b: KidsEvent): number {
  return compareEvents(a, b);
}

function byTitle(a: KidsEvent, b: KidsEvent): number {
  return a.title.localeCompare(b.title, "pl");
}

export function partitionEvents(events: KidsEvent[], today: string, filters: EventFilters) {
  const upcoming: KidsEvent[] = [];
  const recurring: KidsEvent[] = [];
  for (const event of events) {
    if (isPast(event, today)) continue;
    if (!matchesFilters(event, filters, today)) continue;
    if (isRecurring(event)) recurring.push(event);
    else upcoming.push(event);
  }
  upcoming.sort(byDate);
  recurring.sort(byTitle);
  return { upcoming, recurring };
}

export function eventKey(event: KidsEvent): string {
  return `${event.title}__${event.startDate ?? "stale"}__${event.place}`;
}

export function isInsideBounds(event: KidsEvent, bounds: MapBounds): boolean {
  return (
    event.lat >= bounds.south &&
    event.lat <= bounds.north &&
    event.lng >= bounds.west &&
    event.lng <= bounds.east
  );
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} musi być niepustym tekstem`);
  }
}

function assertEvent(value: unknown, index: number): asserts value is KidsEvent {
  if (!value || typeof value !== "object") throw new Error(`Wydarzenie ${index} nie jest obiektem`);
  const event = value as KidsEvent;
  const where = `Wydarzenie ${index} (${typeof event.title === "string" ? event.title : "?"})`;
  assertString(event.dateText, `${where}: dateText`);
  assertString(event.title, `${where}: title`);
  assertString(event.url, `${where}: url`);
  if (!/^https?:\/\//.test(event.url)) throw new Error(`${where}: url musi zaczynać się od http`);
  assertString(event.description, `${where}: description`);
  assertString(event.age, `${where}: age`);
  const minOk = event.ageMin === null || (typeof event.ageMin === "number" && Number.isInteger(event.ageMin) && event.ageMin >= 0);
  const maxOk = event.ageMax === null || (typeof event.ageMax === "number" && Number.isInteger(event.ageMax) && event.ageMax >= 0);
  if (!minOk || !maxOk) throw new Error(`${where}: ageMin i ageMax muszą być liczbami całkowitymi albo null`);
  if (event.ageMin === null && event.ageMax !== null) throw new Error(`${where}: ageMax wymaga ageMin`);
  if (event.ageMin !== null && event.ageMax !== null && event.ageMax < event.ageMin) {
    throw new Error(`${where}: ageMax jest mniejsze niż ageMin`);
  }
  assertString(event.place, `${where}: place`);
  assertString(event.registration, `${where}: registration`);
  if (!AREAS.includes(event.area as Area)) throw new Error(`${where}: nieznany obszar`);
  if (!CATEGORIES.includes(event.category as Category)) throw new Error(`${where}: nieznana kategoria`);
  if (typeof event.isNew !== "boolean") throw new Error(`${where}: isNew musi być true/false`);
  if (event.startDate !== null && (typeof event.startDate !== "string" || !ISO_DATE.test(event.startDate))) {
    throw new Error(`${where}: startDate musi być ISO albo null`);
  }
  if (event.endDate != null && (typeof event.endDate !== "string" || !ISO_DATE.test(event.endDate))) {
    throw new Error(`${where}: endDate musi być ISO`);
  }
  if (event.startDate && event.endDate && event.endDate < event.startDate) {
    throw new Error(`${where}: endDate jest wcześniejsze niż startDate`);
  }
  if (event.recurrence !== "single" && event.recurrence !== "recurring") {
    throw new Error(`${where}: recurrence musi być „single” albo „recurring”`);
  }
  const recurring = event.startDate === null;
  if (recurring !== (event.category === "stałe")) {
    throw new Error(`${where}: kategoria „stałe” jest zarezerwowana dla zajęć bez daty`);
  }
  if (!Array.isArray(event.tags) || event.tags.some((tag) => typeof tag !== "string" || !/^[a-z0-9-]+$/.test(tag))) {
    throw new Error(`${where}: tags musi być listą znaczników`);
  }
  if (typeof event.lat !== "number" || !Number.isFinite(event.lat) || event.lat < 45.8 || event.lat > 48.5) {
    throw new Error(`${where}: lat musi być współrzędną w Szwajcarii albo w Europa-Parku w Rust`);
  }
  if (typeof event.lng !== "number" || !Number.isFinite(event.lng) || event.lng < 5.9 || event.lng > 10.6) {
    throw new Error(`${where}: lng musi być współrzędną w Szwajcarii`);
  }
  if (typeof event.image !== "string" || !/^images\/[a-z0-9-]+\.jpg$/.test(event.image)) {
    throw new Error(`${where}: image musi wskazywać plik images/*.jpg`);
  }
}

function assertHighlight(value: unknown, index: number): EventHighlight {
  if (!value || typeof value !== "object") throw new Error(`Wyróżnienie ${index} nie jest obiektem`);
  const highlight = value as EventHighlight;
  if (typeof highlight.tag !== "string" || !/^[a-z0-9-]+$/.test(highlight.tag)) {
    throw new Error(`Wyróżnienie ${index}: tag musi być znacznikiem`);
  }
  if (typeof highlight.label !== "string" || highlight.label.trim() === "") {
    throw new Error(`Wyróżnienie ${index}: label musi być niepustym tekstem`);
  }
  if (typeof highlight.until !== "string" || !ISO_DATE.test(highlight.until)) {
    throw new Error(`Wyróżnienie ${index}: until musi być datą ISO`);
  }
  return { tag: highlight.tag, label: highlight.label.trim(), until: highlight.until };
}

export function parseEventsFile(data: unknown): EventsFile {
  if (!data || typeof data !== "object") throw new Error("events.json nie jest obiektem");
  const file = data as EventsFile & { highlights?: unknown };
  if (typeof file.updatedAt !== "string" || !ISO_DATE.test(file.updatedAt)) {
    throw new Error("updatedAt musi być datą ISO");
  }
  if (!Array.isArray(file.events) || file.events.length === 0) {
    throw new Error("events musi być niepustą listą");
  }
  file.events.forEach(assertEvent);
  const rawHighlights = file.highlights;
  const highlights =
    rawHighlights === undefined ? [] : Array.isArray(rawHighlights) ? rawHighlights.map(assertHighlight) : null;
  if (!highlights) throw new Error("highlights musi być listą");
  return { updatedAt: file.updatedAt, highlights, events: file.events };
}

export const EMPTY_FILTERS: EventFilters = {
  query: "",
  areas: [],
  categories: [],
  age: null,
  date: { kind: "all" },
  tags: [],
  recurrence: "single",
};

export function filtersAreActive(filters: EventFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.areas.length > 0 ||
    filters.categories.length > 0 ||
    filters.age !== null ||
    filters.date.kind !== "today" ||
    filters.tags.length > 0 ||
    filters.recurrence !== "single"
  );
}

/** Selected filter choices, excluding the search box. Jednodniowe and Dziś count as zero. */
export function activeFilterCount(filters: EventFilters, onlyVisible = false): number {
  return (
    filters.areas.length +
    filters.categories.length +
    (filters.age !== null ? 1 : 0) +
    filters.tags.length +
    (filters.recurrence !== "single" ? 1 : 0) +
    (onlyVisible ? 1 : 0)
  );
}
