import { calendarTargetOrder, eventCardActions, isIosDevice } from "./cardActions";
import { describe, expect, it } from "vitest";

const located = { lat: 47.41, lng: 8.54 };
const page = "https://example.com/literacy";

describe("eventCardActions", () => {
  it("keeps the page link primary and shows the map when both exist", () => {
    expect(eventCardActions({ url: page, ...located })).toEqual({ primary: "page", showMap: true });
  });

  it("promotes the calendar when there is no event URL and still shows the map", () => {
    expect(eventCardActions({ url: "", ...located })).toEqual({ primary: "calendar", showMap: true });
    expect(eventCardActions({ url: "   ", ...located })).toEqual({ primary: "calendar", showMap: true });
    expect(eventCardActions({ url: "brak", ...located })).toEqual({ primary: "calendar", showMap: true });
    expect(eventCardActions({ url: null, ...located })).toEqual({ primary: "calendar", showMap: true });
  });

  it("hides the map when the event has no coordinates", () => {
    expect(eventCardActions({ url: page, lat: null, lng: null })).toEqual({ primary: "page", showMap: false });
    expect(eventCardActions({ url: page, lat: 47.41, lng: undefined })).toEqual({ primary: "page", showMap: false });
    expect(eventCardActions({ url: page, lat: Number.NaN, lng: 8.54 })).toEqual({ primary: "page", showMap: false });
  });

  it("promotes the calendar and hides the map when both are missing", () => {
    expect(eventCardActions({ url: "", lat: null, lng: null })).toEqual({ primary: "calendar", showMap: false });
  });
});

describe("calendarTargetOrder", () => {
  it("lists Google, then Outlook, then the .ics download away from iOS", () => {
    expect(calendarTargetOrder(false)).toEqual(["google", "outlook", "ics"]);
    expect(isIosDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", { platform: "MacIntel", maxTouchPoints: 0 })).toBe(
      false,
    );
  });

  it("puts the .ics download first on iPhone, iPad, and iPadOS desktop user agents", () => {
    expect(calendarTargetOrder(true)).toEqual(["ics", "google", "outlook"]);
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
    expect(
      isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", { platform: "MacIntel", maxTouchPoints: 5 }),
    ).toBe(true);
  });
});
