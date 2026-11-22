import { hasMapLocation, type EventCardActionInput } from "./cardActions";

export type RoutePoint = EventCardActionInput & { place?: string | null };

/** A route needs a pin and a place name. The pin may only be near the venue. */
export function canRoute(event: RoutePoint): boolean {
  return hasMapLocation(event) && typeof event.place === "string" && event.place.trim() !== "";
}

export function googleTransitUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

export function appleTransitUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=r`;
}
