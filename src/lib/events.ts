import { matchesAge } from "./age";
import { fold } from "./text";
import {
  AREAS,
  CATEGORIES,
  type Area,
  type Category,
  type EventFilters,
  type EventsFile,
  type KidsEvent,
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

export function matchesFilters(event: KidsEvent, filters: EventFilters): boolean {
  if (filters.areas.length > 0 && !filters.areas.includes(event.area)) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(event.category)) return false;
  if (filters.age !== null && !matchesAge(event.age, filters.age, event.startDate)) return false;
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
    if (!matchesFilters(event, filters)) continue;
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
};

export function filtersAreActive(filters: EventFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.areas.length > 0 ||
    filters.categories.length > 0 ||
    filters.age !== null
  );
}
