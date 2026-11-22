import { addDays, formatChipDay, isoWeekday } from "./dates";
import { countLabel, splitIso } from "./format";

const WEEKDAYS_LONG = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];
const WEEKDAYS_SHORT = ["pn", "wt", "śr", "cz", "pt", "sb", "ndz."];

export interface DayEvent {
  startDate: string | null;
  dateText: string;
  title: string;
}

export interface DayGroup<T> {
  iso: string;
  events: T[];
}

/** First clock time in the listing, used to sort a day. */
export function eventStartMinutes(dateText: string): number | null {
  const match = /(\d{1,2}):(\d{2})/.exec(dateText);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatClock(dateText: string): string {
  const minutes = eventStartMinutes(dateText);
  if (minutes === null) return "—";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

export function groupByDay<T extends DayEvent>(events: T[]): { days: DayGroup<T>[]; undated: T[] } {
  const undated: T[] = [];
  const buckets = new Map<string, T[]>();
  for (const event of events) {
    if (!event.startDate) {
      undated.push(event);
      continue;
    }
    const bucket = buckets.get(event.startDate) ?? [];
    bucket.push(event);
    buckets.set(event.startDate, bucket);
  }
  const days = [...buckets.entries()]
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([iso, items]) => ({
      iso,
      events: items.slice().sort((left, right) => {
        const a = eventStartMinutes(left.dateText);
        const b = eventStartMinutes(right.dateText);
        if (a === null && b === null) return left.title.localeCompare(right.title, "pl");
        if (a === null) return 1;
        if (b === null) return -1;
        if (a !== b) return a - b;
        return left.title.localeCompare(right.title, "pl");
      }),
    }));
  undated.sort((left, right) => left.title.localeCompare(right.title, "pl"));
  return { days, undated };
}

export function dayTile(iso: string): { month: string; day: number } {
  const parts = splitIso(iso);
  return { month: parts.month.toLocaleUpperCase("pl"), day: parts.day };
}

/** `Dziś · ndz. 22.11 · 4 wydarzenia` */
export function dayHeaderLabel(iso: string, today: string, count: number): string {
  const index = isoWeekday(iso) - 1;
  const name = iso === today ? "Dziś" : iso === addDays(today, 1) ? "Jutro" : capitalize(WEEKDAYS_LONG[index] ?? "");
  const when = `${WEEKDAYS_SHORT[index] ?? ""} ${formatChipDay(iso)}`;
  return `${name} · ${when} · ${countLabel(count, "wydarzenie", "wydarzenia", "wydarzeń")}`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("pl") + value.slice(1);
}
