export type CalendarTarget = "ics" | "google" | "outlook";

export type EventCardActionInput = {
  url?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export interface EventCardActionState {
  /** Page link when the event has an http(s) URL, otherwise the calendar button. */
  primary: "page" | "calendar";
  /** Map control is omitted when the event has no coordinates. */
  showMap: boolean;
}

const EVENT_PAGE_URL = /^https?:\/\/\S+$/i;

export function hasEventPage(event: EventCardActionInput): boolean {
  return typeof event.url === "string" && EVENT_PAGE_URL.test(event.url.trim());
}

export function hasMapLocation(event: EventCardActionInput): boolean {
  return typeof event.lat === "number" && Number.isFinite(event.lat) && typeof event.lng === "number" && Number.isFinite(event.lng);
}

export function eventCardActions(event: EventCardActionInput): EventCardActionState {
  return {
    primary: hasEventPage(event) ? "page" : "calendar",
    showMap: hasMapLocation(event),
  };
}

export function isIosDevice(
  userAgent: string,
  hints?: { platform?: string; maxTouchPoints?: number },
): boolean {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return true;
  // iPadOS 13+ sends a desktop Macintosh user agent and reports touch points.
  return hints?.platform === "MacIntel" && (hints.maxTouchPoints ?? 0) > 1;
}

/** Google leads on the web. The .ics download leads on iOS, where it opens Calendar. */
export function calendarTargetOrder(ios: boolean): CalendarTarget[] {
  return ios ? ["ics", "google", "outlook"] : ["google", "outlook", "ics"];
}
