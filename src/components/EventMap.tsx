import L from "leaflet";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CalendarMenu } from "./CalendarMenu";
import { isIosDevice } from "../lib/cardActions";
import { appleTransitUrl, canRoute, googleTransitUrl } from "../lib/directions";
import { eventKey } from "../lib/events";
import { categoryAppearance } from "../lib/markers";
import type { KidsEvent, MapBounds } from "../types";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

const OERLIKON: L.LatLngExpression = [47.411, 8.544];

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(event: KidsEvent, selected: boolean): L.DivIcon {
  const look = categoryAppearance(event.category);
  const key = `${event.category}:${look.icon}:${look.color}:${selected ? "1" : "0"}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const size = selected ? 44 : 34;
  const icon = L.divIcon({
    className: "pin-wrap",
    html: `<span class="pin${selected ? " pin--selected" : ""}" style="--pin:${look.color}"><span>${look.icon}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 6],
  });
  iconCache.set(key, icon);
  return icon;
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  return L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: "marker-cluster marker-cluster-small cluster-pin",
    iconSize: L.point(42, 42),
    iconAnchor: L.point(21, 21),
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function polishMapChrome(map: L.Map) {
  const root = map.getContainer();
  const zoomIn = root.querySelector<HTMLElement>(".leaflet-control-zoom-in");
  const zoomOut = root.querySelector<HTMLElement>(".leaflet-control-zoom-out");
  zoomIn?.setAttribute("aria-label", "Przybliż");
  zoomIn?.setAttribute("title", "Przybliż");
  zoomOut?.setAttribute("aria-label", "Oddal");
  zoomOut?.setAttribute("title", "Oddal");
  if (prefersReducedMotion()) {
    map.options.zoomAnimation = false;
    map.options.fadeAnimation = false;
    map.options.markerZoomAnimation = false;
  }
}

function sameBounds(current: MapBounds | null, next: MapBounds): boolean {
  if (!current) return false;
  const round = (value: number) => Math.round(value * 1e4) / 1e4;
  return (
    round(current.south) === round(next.south) &&
    round(current.west) === round(next.west) &&
    round(current.north) === round(next.north) &&
    round(current.east) === round(next.east)
  );
}

const FIT_PADDING: L.PointExpression = [48, 48];

function eventBoundsKey(events: KidsEvent[]): string {
  return events
    .map((event) => `${event.lat.toFixed(5)},${event.lng.toFixed(5)}`)
    .sort()
    .join(";");
}

function fitEventBounds(map: L.Map, events: KidsEvent[]) {
  const points = events
    .filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
    .map((event) => L.latLng(event.lat, event.lng));
  if (points.length === 0) {
    map.setView(OERLIKON, 13, { animate: false });
    return;
  }
  map.fitBounds(L.latLngBounds(points), { padding: FIT_PADDING, maxZoom: 15, animate: false });
}

function MapBridge({
  active,
  events,
  selectedId,
  focusTick,
  focusOrigin,
  markers,
  clusterRef,
  onBounds,
}: {
  active: boolean;
  events: KidsEvent[];
  selectedId: string | null;
  focusTick: number;
  focusOrigin: "list" | "map";
  markers: MutableRefObject<Map<string, L.Marker>>;
  clusterRef: MutableRefObject<L.MarkerClusterGroup | null>;
  onBounds: (bounds: MapBounds) => void;
}) {
  const map = useMap();
  const onBoundsRef = useRef(onBounds);
  const lastBounds = useRef<MapBounds | null>(null);
  const fittedKey = useRef<string | null>(null);
  const boundsKey = eventBoundsKey(events);
  onBoundsRef.current = onBounds;

  function publish() {
    const size = map.getSize();
    if (size.x < 40 || size.y < 40) return;
    const box = map.getBounds();
    const next = {
      south: box.getSouth(),
      west: box.getWest(),
      north: box.getNorth(),
      east: box.getEast(),
    };
    if (sameBounds(lastBounds.current, next)) return;
    lastBounds.current = next;
    onBoundsRef.current(next);
  }

  useMapEvents({
    moveend() {
      if (active) publish();
    },
  });

  useEffect(() => {
    if (!active || fittedKey.current === boundsKey) return;
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      fitEventBounds(map, events);
      fittedKey.current = boundsKey;
      publish();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [active, boundsKey, events, map]);

  useEffect(() => {
    if (!active || focusOrigin !== "list" || !selectedId) return;
    const marker = markers.current.get(selectedId);
    const group = clusterRef.current;
    if (!marker || !group) return;
    const reveal = () => {
      map.invalidateSize();
      marker.openPopup();
    };
    const reduced = prefersReducedMotion();
    if (reduced) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: false });
      reveal();
      return;
    }
    try {
      group.zoomToShowLayer(marker, reveal);
    } catch {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.45 });
      window.setTimeout(reveal, 480);
    }
  }, [active, clusterRef, focusOrigin, focusTick, map, markers, selectedId]);

  useEffect(() => {
    if (!active || focusOrigin !== "map" || !selectedId) return;
    const marker = markers.current.get(selectedId);
    if (!marker) return;
    const open = () => {
      if (!marker.isPopupOpen()) marker.openPopup();
    };
    open();
    const timer = window.setTimeout(open, 60);
    return () => window.clearTimeout(timer);
  }, [active, focusOrigin, focusTick, map, markers, selectedId]);

  useEffect(() => {
    const pane = map.getPane("markerPane");
    if (!pane) return;
    const stopDrag = (event: Event) => {
      if ((event.target as HTMLElement | null)?.closest(".leaflet-marker-icon")) event.stopPropagation();
    };
    pane.addEventListener("mousedown", stopDrag);
    pane.addEventListener("touchstart", stopDrag, { passive: true });
    return () => {
      pane.removeEventListener("mousedown", stopDrag);
      pane.removeEventListener("touchstart", stopDrag);
    };
  }, [map]);

  useEffect(() => {
    polishMapChrome(map);
    const onPopup = (event: L.PopupEvent) => {
      const close = event.popup.getElement()?.querySelector<HTMLElement>(".leaflet-popup-close-button");
      close?.setAttribute("aria-label", "Zamknij");
      close?.setAttribute("title", "Zamknij");
    };
    map.on("popupopen", onPopup);
    return () => {
      map.off("popupopen", onPopup);
    };
  }, [map]);

  return null;
}

export function EventMap({
  events,
  today,
  selectedId,
  highlightId,
  focusTick,
  focusOrigin,
  active,
  onSelect,
  onShowInList,
  onBounds,
}: {
  events: KidsEvent[];
  today: string;
  selectedId: string | null;
  highlightId: string | null;
  focusTick: number;
  focusOrigin: "list" | "map";
  active: boolean;
  onSelect: (id: string) => void;
  onShowInList: (id: string) => void;
  onBounds: (bounds: MapBounds) => void;
}) {
  const markers = useRef(new Map<string, L.Marker>());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [ios] = useState(() =>
    typeof navigator !== "undefined" &&
      isIosDevice(navigator.userAgent, { platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints }),
  );

  return (
    <MapContainer
      center={OERLIKON}
      className="event-map"
      scrollWheelZoom
      zoom={13}
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBridge
        active={active}
        clusterRef={clusterRef}
        events={events}
        focusOrigin={focusOrigin}
        focusTick={focusTick}
        markers={markers}
        selectedId={selectedId}
        onBounds={onBounds}
      />
      <MarkerClusterGroup
        ref={clusterRef}
        chunkedLoading
        iconCreateFunction={clusterIcon}
        maxClusterRadius={46}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
      >
        {events.map((event) => {
          const key = eventKey(event);
          const selected = key === selectedId || key === highlightId;
          return (
            <Marker
              key={key}
              ref={(marker) => {
                if (marker) markers.current.set(key, marker);
                else markers.current.delete(key);
              }}
              eventHandlers={{
                click: (leafletEvent) => {
                  onSelect(key);
                  const marker = leafletEvent.target as L.Marker;
                  const open = () => {
                    if (!marker.isPopupOpen()) marker.openPopup();
                  };
                  open();
                  window.setTimeout(open, 80);
                },
              }}
              icon={markerIcon(event, selected)}
              position={[event.lat, event.lng]}
              zIndexOffset={selected ? 800 : 0}
            >
              <Popup autoPanPadding={[24, 48]} keepInView maxWidth={288}>
                <div className="map-popup">
                  <strong>{event.title}</strong>
                  <p>{event.dateText}</p>
                  <p>{event.place}</p>
                  {event.url ? (
                    <a href={event.url} rel="noopener noreferrer" target="_blank">
                      Strona wydarzenia
                    </a>
                  ) : null}
                  <div className="map-popup__actions">
                    {canRoute(event) ? (
                      <a
                        className="map-popup__route"
                        href={googleTransitUrl(event.lat, event.lng)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Trasa
                      </a>
                    ) : null}
                    <button className="map-popup__list" type="button" onClick={() => onShowInList(key)}>
                      Pokaż na liście
                    </button>
                  </div>
                  {canRoute(event) ? (
                    <a className="map-popup__link" href={googleTransitUrl(event.lat, event.lng)} rel="noopener noreferrer" target="_blank">
                      Google
                    </a>
                  ) : null}
                  {canRoute(event) && ios ? (
                    <a className="map-popup__link" href={appleTransitUrl(event.lat, event.lng)} rel="noopener noreferrer" target="_blank">
                      Apple Maps
                    </a>
                  ) : null}
                  <CalendarMenu event={event} today={today} />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
