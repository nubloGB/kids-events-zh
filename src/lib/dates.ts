import type { DateFilter } from "../types";

export type DatePreset =
  | "all"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "thisWeekend"
  | "nextWeek"
  | "nextMonth"
  /** Today and the six days after it. The header slider calls this “Tydzień”. */
  | "rollingWeek"
  /** Today through the day 30 days later. The header slider calls this “Miesiąc”. */
  | "rollingMonth"
  | "custom";

export interface DayRange {
  from: string;
  to: string;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday is 1 and Sunday is 7. */
export function isoWeekday(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day));
  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

/** Calendar day in Europe/Zurich, independent of the device time zone. */
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

/** Minutes to add to UTC to get the Europe/Zurich wall clock at `instant`. */
export function zurichOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Zurich",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** UTC instant when `isoDate` begins in Europe/Zurich. */
export function zurichMidnight(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  let utc = Date.UTC(year, (month ?? 1) - 1, day, 0, 0, 0);
  const offset = zurichOffsetMinutes(new Date(utc));
  utc -= offset * 60_000;
  const offsetAtMidnight = zurichOffsetMinutes(new Date(utc));
  if (offsetAtMidnight !== offset) utc -= (offsetAtMidnight - offset) * 60_000;
  return new Date(utc);
}

/** Milliseconds from `now` until the next Europe/Zurich midnight. Zero only exactly at midnight. */
export function msUntilNextZurichMidnight(now = new Date()): number {
  const tomorrow = addDays(zurichToday(now), 1);
  return Math.max(0, zurichMidnight(tomorrow).getTime() - now.getTime());
}

export function presetRange(preset: Exclude<DatePreset, "all" | "custom">, today: string): DayRange {
  const weekday = isoWeekday(today);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "tomorrow": {
      const tomorrow = addDays(today, 1);
      return { from: tomorrow, to: tomorrow };
    }
    case "thisWeek":
      return { from: today, to: addDays(today, 7 - weekday) };
    case "thisWeekend": {
      // Nearest Saturday–Sunday. On Sunday the current weekend is over, so take the next one.
      if (weekday === 7) {
        const from = addDays(today, 6);
        return { from, to: addDays(from, 1) };
      }
      const from = addDays(today, 6 - weekday);
      return { from, to: addDays(from, 1) };
    }
    case "nextWeek": {
      const from = addDays(today, weekday === 1 ? 7 : 8 - weekday);
      return { from, to: addDays(from, 6) };
    }
    case "rollingWeek":
      return { from: today, to: addDays(today, 6) };
    case "rollingMonth":
      return { from: today, to: addDays(today, 30) };
    case "nextMonth": {
      const [year, month] = today.split("-").map(Number);
      const start = new Date(Date.UTC(year, month, 1));
      const end = new Date(Date.UTC(year, month + 1, 0));
      return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
    }
    default: {
      const never: never = preset;
      return never;
    }
  }
}

/** Concrete inclusive range for a date filter. `null` means no date limit. */
export function resolveDateRange(date: DateFilter, today: string): DayRange | null {
  if (date.kind === "all") return null;
  if (date.kind === "custom") return normalizeRange(date.from, date.to);
  return presetRange(date.kind, today);
}

export function normalizeRange(from: string, to: string): DayRange | null {
  if (!from && !to) return null;
  const start = from || to;
  const end = to || from;
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

export function formatDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}.`;
}

export function formatRange(range: DayRange): string {
  if (range.from === range.to) return formatDay(range.from);
  return `${formatDay(range.from)}–${formatDay(range.to)}`;
}

/** Chip text without a trailing dot: `22.11` or `22.11–29.11`. */
export function formatChipDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)}.${Number(month)}`;
}

/** `22.11`, `22–28.11` in one month, otherwise `28.11–4.12`. */
export function formatCompactRange(range: DayRange): string {
  const [, monthFrom, dayFrom] = range.from.split("-");
  const [, monthTo, dayTo] = range.to.split("-");
  if (range.from === range.to) return `${Number(dayFrom)}.${Number(monthFrom)}`;
  if (monthFrom === monthTo) return `${Number(dayFrom)}–${Number(dayTo)}.${Number(monthTo)}`;
  return `${Number(dayFrom)}.${Number(monthFrom)}–${Number(dayTo)}.${Number(monthTo)}`;
}

export function formatChipRange(range: DayRange): string {
  return formatCompactRange(range);
}

export function rangesOverlap(start: string, end: string, range: DayRange): boolean {
  return start <= range.to && end >= range.from;
}

const WEEKDAYS = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

/** Empty-list title for a concrete date filter, for example `Brak wydarzeń w poniedziałek 23.11`. */
export function emptyRangeTitle(date: DateFilter, today: string): string | null {
  const range = resolveDateRange(date, today);
  if (!range) return null;
  if (range.from === range.to) {
    const name = WEEKDAYS[isoWeekday(range.from) - 1] ?? "";
    return `Brak wydarzeń w ${name} ${formatChipDay(range.from)}`;
  }
  return `Brak wydarzeń w ${formatCompactRange(range)}`;
}
