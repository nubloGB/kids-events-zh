import { Dropdown, buttonVariants } from "@heroui/react";
import { MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { ActionTip } from "./ActionTip";
import { isIosDevice } from "../lib/cardActions";
import { appleTransitUrl, googleTransitUrl } from "../lib/directions";
import type { KidsEvent } from "../types";

function deviceIsIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIosDevice(navigator.userAgent, {
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

export function RouteMenu({
  event,
  tooltip,
  onShowOnMap,
}: {
  event: KidsEvent;
  tooltip: string | null;
  onShowOnMap: () => void;
}) {
  const [ios] = useState(deviceIsIos);
  const [open, setOpen] = useState(false);

  function go(key: string | number) {
    if (key === "map") onShowOnMap();
    else if (key === "google") window.open(googleTransitUrl(event.lat, event.lng), "_blank", "noopener,noreferrer");
    else if (key === "apple") window.open(appleTransitUrl(event.lat, event.lng), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="route-menu" onClick={(eventClick) => eventClick.stopPropagation()} onKeyDown={(keyEvent) => keyEvent.stopPropagation()}>
      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <ActionTip disabled={open} label={tooltip}>
          <Dropdown.Trigger
            aria-label="Mapa i trasa"
            className={`${buttonVariants({ variant: "secondary" })} event-action event-action--secondary`}
          >
            <Navigation aria-hidden className="event-action__icon" size={20} strokeWidth={2} />
            <span className="event-action__text event-action__text--short">Mapa</span>
          </Dropdown.Trigger>
        </ActionTip>
        <Dropdown.Popover className="route-menu__popover" placement="top end">
          <Dropdown.Menu aria-label="Mapa i trasa" onAction={(key) => go(key)}>
            <Dropdown.Item id="map" textValue="Pokaż na mapie">
              <MapPin aria-hidden size={18} strokeWidth={2} />
              Pokaż na mapie
            </Dropdown.Item>
            <Dropdown.Item id="google" textValue="Trasa w Google Maps">
              <Navigation aria-hidden size={18} strokeWidth={2} />
              Trasa w Google Maps
            </Dropdown.Item>
            {ios ? (
              <Dropdown.Item id="apple" textValue="Trasa w Apple Maps">
                <Navigation aria-hidden size={18} strokeWidth={2} />
                Trasa w Apple Maps
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

/** Directions only: Google Maps and Apple Maps. Apple is listed first on iOS. */
export function TransitMenu({ event }: { event: KidsEvent }) {
  const [ios] = useState(deviceIsIos);
  const [open, setOpen] = useState(false);
  const targets = ios ? (["apple", "google"] as const) : (["google", "apple"] as const);

  function go(key: string | number) {
    const url = key === "apple" ? appleTransitUrl(event.lat, event.lng) : googleTransitUrl(event.lat, event.lng);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="map-popup__menu" onClick={(eventClick) => eventClick.stopPropagation()} onPointerDown={(eventClick) => eventClick.stopPropagation()}>
      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <Dropdown.Trigger aria-label="Trasa" className="map-popup__icon">
          <span title="Trasa">
            <Navigation aria-hidden size={20} strokeWidth={2} />
          </span>
        </Dropdown.Trigger>
        <Dropdown.Popover className="map-popup__popover" placement="bottom">
          <Dropdown.Menu aria-label="Trasa" onAction={(key) => go(key)}>
            {targets.map((target) => (
              <Dropdown.Item key={target} id={target} textValue={target === "apple" ? "Apple Maps" : "Google Maps"}>
                <Navigation aria-hidden size={18} strokeWidth={2} />
                {target === "apple" ? "Apple Maps" : "Google Maps"}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
