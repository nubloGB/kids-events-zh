import { countLabel } from "./format";
import { formatChipDay, isoWeekday, normalizeRange, presetRange, resolveDateRange, type DayRange } from "./dates";
import type { DateFilter } from "../types";

export const SLIDER_STOPS = [
  { id: "today", label: "Dziś", kind: "today" },
  { id: "tomorrow", label: "Jutro", kind: "tomorrow" },
  { id: "weekend", label: "Weekend", kind: "thisWeekend" },
  { id: "week", label: "Tydzień", kind: "rollingWeek" },
  { id: "month", label: "Miesiąc", kind: "rollingMonth" },
  { id: "all", label: "Wszystkie", kind: "all" },
] as const;

export type SliderStopId = (typeof SLIDER_STOPS)[number]["id"];

const WEEKDAYS = ["pn", "wt", "śr", "cz", "pt", "sb", "nd"] as const;

const OFF_STOP_LABEL: Partial<Record<DateFilter["kind"], string>> = {
  thisWeek: "Ten tydzień",
  nextWeek: "Następny tydzień",
  nextMonth: "Następny miesiąc",
};

export function sliderStopFor(date: DateFilter): SliderStopId | null {
  const match = SLIDER_STOPS.find((stop) => stop.kind === date.kind);
  return match ? match.id : null;
}

export function dateForSliderStop(id: SliderStopId): DateFilter {
  const stop = SLIDER_STOPS.find((item) => item.id === id);
  if (!stop || stop.kind === "all") return { kind: "all" };
  return { kind: stop.kind };
}

/** Name and date of a stop, without the result count. */
export function sliderStopText(id: SliderStopId, today: string): string {
  const date = dateForSliderStop(id);
  if (date.kind === "all" || date.kind === "custom") return "Wszystkie";
  const range = presetRange(date.kind, today);
  const stop = SLIDER_STOPS.find((item) => item.id === id);
  return `${stop?.label ?? "Data"}, ${whenText(range)}`;
}

/** `12–18.12` in one month, otherwise `28.11–4.12`. */
export function formatOwnRange(range: DayRange): string {
  const [, monthFrom, dayFrom] = range.from.split("-");
  const [, monthTo, dayTo] = range.to.split("-");
  if (range.from === range.to) return `${Number(dayFrom)}.${Number(monthFrom)}`;
  if (monthFrom === monthTo) return `${Number(dayFrom)}–${Number(dayTo)}.${Number(monthTo)}`;
  return `${Number(dayFrom)}.${Number(monthFrom)}–${Number(dayTo)}.${Number(monthTo)}`;
}

export function ownRangeLabel(from: string, to: string): string {
  const range = normalizeRange(from, to);
  if (!range) return "Własny";
  return `Własny: ${formatOwnRange(range)}`;
}

function weekdayMark(iso: string): string {
  return WEEKDAYS[isoWeekday(iso) - 1] ?? "";
}

function whenText(range: DayRange): string {
  if (range.from === range.to) return `${weekdayMark(range.from)} ${formatChipDay(range.from)}`;
  return `${weekdayMark(range.from)} ${formatChipDay(range.from)}–${weekdayMark(range.to)} ${formatChipDay(range.to)}`;
}

/** Bubble above the thumb, for example `Dziś, nd 22.11 · 4 wydarzenia`. */
export function sliderBubble(date: DateFilter, today: string, count: number): string {
  const noun = countLabel(count, "wydarzenie", "wydarzenia", "wydarzeń");
  if (date.kind === "custom") return `${ownRangeLabel(date.from, date.to)} · ${noun}`;
  if (date.kind === "all") return `Wszystkie · ${noun}`;
  const stop = SLIDER_STOPS.find((item) => item.kind === date.kind);
  const range = resolveDateRange(date, today);
  const name = stop?.label ?? OFF_STOP_LABEL[date.kind] ?? "Data";
  if (!range) return `${name} · ${noun}`;
  if (stop) return `${name}, ${whenText(range)} · ${noun}`;
  return `${name}: ${formatOwnRange(range)} · ${noun}`;
}
