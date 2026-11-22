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
            <MapPin aria-hidden className="event-action__icon" size={20} strokeWidth={2} />
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
