import type { DateFilter } from "../types";

const PRESETS = [
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

/** `null` means the default “Wszystkie daty”, which is omitted from the URL. */
export function serializeDate(date: DateFilter): string | null {
  if (date.kind === "all") return null;
  if (date.kind === "custom") return `custom:${date.from}:${date.to}`;
  return date.kind;
}

/** `null` when the query value is missing or not a date filter we understand. */
export function parseDateQuery(value: string | null): DateFilter | null {
  if (value === null || value === "") return { kind: "all" };
  if (isPreset(value)) return { kind: value };
  const custom = /^custom:(\d{4}-\d{2}-\d{2})?:(\d{4}-\d{2}-\d{2})?$/.exec(value);
  if (!custom) return null;
  return { kind: "custom", from: custom[1] ?? "", to: custom[2] ?? "" };
}

export function readDateFromLocation(): DateFilter {
  if (typeof window === "undefined") return { kind: "all" };
  const parsed = parseDateQuery(new URLSearchParams(window.location.search).get("data"));
  return parsed ?? { kind: "all" };
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
