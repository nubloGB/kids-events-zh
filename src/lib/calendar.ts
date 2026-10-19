import { addDays } from "./dates";
import type { KidsEvent } from "../types";

export interface CalendarSpan {
  allDay: boolean;
  /** Inclusive start. Date only, or date plus local Zurich time. */
  startDate: string;
  startMinutes: number | null;
  /** Exclusive end for all-day events, actual end for timed events. */
  endDate: string;
  endMinutes: number | null;
}

interface ClockRange {
  start: number;
  end: number;
}

function minutes(hour: string, minute: string): number | null {
  const h = Number(hour);
  const m = Number(minute);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

function clockRanges(dateText: string): ClockRange[] {
  const ranges: ClockRange[] = [];
  const rangePattern = /(\d{1,2}):(\d{2})\s*[–—-]\s*(?:ok\.\s*)?(\d{1,2}):(\d{2})/g;
  for (const match of dateText.matchAll(rangePattern)) {
    const start = minutes(match[1] ?? "", match[2] ?? "");
    const end = minutes(match[3] ?? "", match[4] ?? "");
    if (start === null || end === null || end <= start) continue;
    ranges.push({ start, end });
  }
  if (ranges.length > 0) return ranges;
  const withoutRanges = dateText.replace(rangePattern, " ");
  const points = [...withoutRanges.matchAll(/(?:^|[^\d])(\d{1,2}):(\d{2})/g)]
    .map((match) => minutes(match[1] ?? "", match[2] ?? ""))
    .filter((value): value is number => value !== null);
  if (points.length === 1) return [{ start: points[0], end: points[0] + 60 }];
  return [];
}

function stamp(date: string, totalMinutes: number): { date: string; minutes: number } {
  const dayShift = Math.floor(totalMinutes / (24 * 60));
  const minutesOfDay = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return { date: dayShift === 0 ? date : addDays(date, dayShift), minutes: minutesOfDay };
}

export function calendarSpan(event: KidsEvent, today: string): CalendarSpan {
  const startDate = event.startDate ?? today;
  const lastDate = event.endDate || startDate;
  if (lastDate !== startDate) {
    return {
      allDay: true,
      startDate,
      startMinutes: null,
      endDate: addDays(lastDate, 1),
      endMinutes: null,
    };
  }
  const ranges = clockRanges(event.dateText);
  if (ranges.length === 0) {
    return {
      allDay: true,
      startDate,
      startMinutes: null,
      endDate: addDays(startDate, 1),
      endMinutes: null,
    };
  }
  const start = Math.min(...ranges.map((range) => range.start));
  const end = Math.max(...ranges.map((range) => range.end));
  const endStamp = stamp(startDate, end);
  return {
    allDay: false,
    startDate,
    startMinutes: start,
    endDate: endStamp.date,
    endMinutes: endStamp.minutes,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function compactDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function compactDateTime(iso: string, totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${compactDate(iso)}T${pad(hour)}${pad(minute)}00`;
}

export function calendarDates(span: CalendarSpan): string {
  if (span.allDay || span.startMinutes === null || span.endMinutes === null) {
    return `${compactDate(span.startDate)}/${compactDate(span.endDate)}`;
  }
  return `${compactDateTime(span.startDate, span.startMinutes)}/${compactDateTime(span.endDate, span.endMinutes)}`;
}

export function calendarDetails(event: KidsEvent): string {
  return [event.description, event.dateText, `Wiek: ${event.age}`, `Zapisy: ${event.registration}`, event.url].join(
    "\n\n",
  );
}

export function googleCalendarUrl(event: KidsEvent, today: string): string {
  const span = calendarSpan(event, today);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: calendarDates(span),
    details: calendarDetails(event),
    location: event.place,
    ctz: "Europe/Zurich",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(bytes.length, start + limit);
    while (end > start && (bytes[end - 1]! & 0xc0) === 0x80) end -= 1;
    parts.push(new TextDecoder().decode(bytes.slice(start, end)));
    start = end;
    limit = 74;
  }
  return parts.join("\r\n ");
}

const ZURICH_ZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Zurich",
  "X-LIC-LOCATION:Europe/Zurich",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export function icsFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  return `${slug || "wydarzenie"}.ics`;
}

export function buildIcs(event: KidsEvent, today: string, now = new Date()): string {
  const span = calendarSpan(event, today);
  const stamp = now.toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const uid = `${icsFilename(event.title).replace(/\.ics$/, "")}-${compactDate(span.startDate)}@kids-events-zh`;
  const when = span.allDay || span.startMinutes === null || span.endMinutes === null
    ? [
        `DTSTART;VALUE=DATE:${compactDate(span.startDate)}`,
        `DTEND;VALUE=DATE:${compactDate(span.endDate)}`,
      ]
    : [
        `DTSTART;TZID=Europe/Zurich:${compactDateTime(span.startDate, span.startMinutes)}`,
        `DTEND;TZID=Europe/Zurich:${compactDateTime(span.endDate, span.endMinutes)}`,
      ];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kids-events-zh//Wydarzenia dla dzieci//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ZURICH_ZONE,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.place)}`,
    `DESCRIPTION:${icsEscape(calendarDetails(event))}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  return lines.map(foldLine).join("\r\n");
}

export function downloadIcs(event: KidsEvent, today: string): void {
  const blob = new Blob([buildIcs(event, today)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = icsFilename(event.title);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
