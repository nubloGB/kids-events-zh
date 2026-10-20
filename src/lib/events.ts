import { matchesAgeBand } from "./age";
import { normalizeRange, presetRange, rangesOverlap } from "./dates";
import { fold } from "./text";
import {
  AREAS,
  CATEGORIES,
  type Area,
  type Category,
  type EventFilters,
  type EventsFile,
  type KidsEvent,
  type MapBounds,
} from "../types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function zurichToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isRecurring(event: KidsEvent): boolean {
  return event.startDate === null;
}

/** An event is past the morning after its last day, in the Zurich calendar. */
export function isPast(event: KidsEvent, today: string): boolean {
  if (!event.startDate) return false;
  const last = event.endDate || event.startDate;
  return last < today;
}

export function includesToday(event: KidsEvent, today: string): boolean {
  if (!event.startDate) return false;
  const last = event.endDate || event.startDate;
  return event.startDate <= today && today <= last;
}

function dateWindow(filters: EventFilters, today: string): { from: string; to: string } | null {
  if (filters.date.kind === "all") return null;
  if (filters.date.kind === "custom") return normalizeRange(filters.date.from, filters.date.to);
  return presetRange(filters.date.kind, today);
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
  const left = a.startDate ?? "";
  const right = b.startDate ?? "";
  if (left !== right) return left < right ? -1 : 1;
  return a.title.localeCompare(b.title, "pl");
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

export function parseEventsFile(data: unknown): EventsFile {
  if (!data || typeof data !== "object") throw new Error("events.json nie jest obiektem");
  const file = data as EventsFile;
  if (typeof file.updatedAt !== "string" || !ISO_DATE.test(file.updatedAt)) {
    throw new Error("updatedAt musi być datą ISO");
  }
  if (!Array.isArray(file.events) || file.events.length === 0) {
    throw new Error("events musi być niepustą listą");
  }
  file.events.forEach(assertEvent);
  return file;
}

export const EMPTY_FILTERS: EventFilters = {
  query: "",
  areas: [],
  categories: [],
  age: null,
  date: { kind: "all" },
  tags: [],
};

export function filtersAreActive(filters: EventFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.areas.length > 0 ||
    filters.categories.length > 0 ||
    filters.age !== null ||
    filters.date.kind !== "all" ||
    filters.tags.length > 0
  );
}
