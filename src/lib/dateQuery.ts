import type { DateFilter } from "../types";

const PRESETS = [
  "all",
  "today",
  "tomorrow",
  "thisWeek",
  "thisWeekend",
  "nextWeek",
  "nextMonth",
  "rollingWeek",
  "rollingMonth",
] as const;

type StoredPreset = (typeof PRESETS)[number];

function isPreset(value: string): value is StoredPreset {
  return (PRESETS as readonly string[]).includes(value);
}

/** `null` means the default “Dziś”, which is omitted from the URL. “Wszystkie” is `all`. */
export function serializeDate(date: DateFilter): string | null {
  if (date.kind === "today") return null;
  if (date.kind === "custom") return `custom:${date.from}:${date.to}`;
  return date.kind;
}

/** Missing value is the default Dziś. `null` means the text is not a date filter we understand. */
export function parseDateQuery(value: string | null): DateFilter | null {
  if (value === null || value === "") return { kind: "today" };
  if (isPreset(value)) return { kind: value };
  const custom = /^custom:(\d{4}-\d{2}-\d{2})?:(\d{4}-\d{2}-\d{2})?$/.exec(value);
  if (!custom) return null;
  return { kind: "custom", from: custom[1] ?? "", to: custom[2] ?? "" };
}

export const DEFAULT_DATE: DateFilter = { kind: "today" };

export function readDateFromLocation(): DateFilter {
  if (typeof window === "undefined") return DEFAULT_DATE;
  const parsed = parseDateQuery(new URLSearchParams(window.location.search).get("data"));
  return parsed ?? DEFAULT_DATE;
}

export function writeDateToLocation(date: DateFilter): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const value = serializeDate(date);
  if (value) url.searchParams.set("data", value);
  else url.searchParams.delete("data");
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) history.replaceState(window.history.state, "", next);
}
