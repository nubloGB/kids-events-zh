import { appleTransitUrl, canRoute, googleTransitUrl } from "./directions";
import { describe, expect, it } from "vitest";

describe("directions", () => {
  it("builds a transit route with no origin", () => {
    expect(googleTransitUrl(47.41, 8.54)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=47.41,8.54&travelmode=transit",
    );
    expect(appleTransitUrl(47.41, 8.54)).toBe("https://maps.apple.com/?daddr=47.41,8.54&dirflg=r");
  });

  it("hides the route when the pin or the place name is missing", () => {
    expect(canRoute({ lat: 47.41, lng: 8.54, place: "GZ Oerlikon" })).toBe(true);
    expect(canRoute({ lat: 47.41, lng: 8.54, place: "  " })).toBe(false);
    expect(canRoute({ lat: null, lng: null, place: "GZ Oerlikon" })).toBe(false);
    expect(canRoute({ lat: 47.41, lng: Number.NaN, place: "GZ Oerlikon" })).toBe(false);
  });
});
