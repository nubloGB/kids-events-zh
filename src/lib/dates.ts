export type DatePreset =
  | "all"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "thisWeekend"
  | "nextWeek"
  | "nextMonth"
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

export function presetRange(preset: Exclude<DatePreset, "all" | "custom">, today: string): DayRange {
  const weekday = isoWeekday(today);
  if (preset === "today") return { from: today, to: today };
  if (preset === "tomorrow") {
    const tomorrow = addDays(today, 1);
    return { from: tomorrow, to: tomorrow };
  }
  if (preset === "thisWeek") return { from: today, to: addDays(today, 7 - weekday) };
  if (preset === "thisWeekend") {
    const from = weekday >= 6 ? today : addDays(today, 5 - weekday);
    return { from, to: addDays(today, 7 - weekday) };
  }
  if (preset === "nextWeek") {
    const from = addDays(today, weekday === 1 ? 7 : 8 - weekday);
    return { from, to: addDays(from, 6) };
  }
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
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

export function rangesOverlap(start: string, end: string, range: DayRange): boolean {
  return start <= range.to && end >= range.from;
}
