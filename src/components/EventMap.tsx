import L from "leaflet";
import { useEffect, useRef, type MutableRefObject } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CalendarMenu } from "./CalendarMenu";
import { TransitMenu } from "./RouteMenu";
import { hasEventPage } from "../lib/cardActions";
import { canRoute } from "../lib/directions";
import { eventKey } from "../lib/events";
import { formatPopupWhen } from "../lib/listDays";
import { eventCategoryMarks, categoryAppearance } from "../lib/markers";
import { ExternalLink, List } from "lucide-react";
import type { KidsEvent, MapBounds } from "../types";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

const OERLIKON: L.LatLngExpression = [47.411, 8.544];

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(event: KidsEvent): L.DivIcon {
  const look = categoryAppearance(event.category);
  const key = `${event.category}:${look.icon}:${look.color}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const size = 34;
  const icon = L.divIcon({
    className: "pin-wrap",
    html: `<span class="pin" style="--pin:${look.color}"><span>${look.icon}</span></span>`,
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
  highlightId,
  focusTick,
  focusOrigin,
  markers,
  clusterRef,
  onBounds,
}: {
  active: boolean;
  events: KidsEvent[];
  selectedId: string | null;
  highlightId: string | null;
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
  const focusLock = useRef(false);
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
      map.invalidateSize({ animate: false, pan: false });
      if (focusLock.current) {
        fittedKey.current = boundsKey;
        publish();
        return;
      }
      fitEventBounds(map, events);
      fittedKey.current = boundsKey;
      publish();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [active, boundsKey, events, map]);

  useEffect(() => {
    if (!active || focusOrigin !== "list" || !selectedId) return;
    focusLock.current = true;
    let cancelled = false;
    let attempts = 0;
    let retryTimer = 0;
    let fallbackTimer = 0;
    let opened = false;
    const finish = (marker: L.Marker) => {
      if (cancelled || opened) return;
      opened = true;
      map.invalidateSize({ animate: false, pan: false });
      if (!marker.isPopupOpen()) marker.openPopup();
      focusLock.current = false;
    };
    const tryReveal = () => {
      if (cancelled) return;
      attempts += 1;
      map.invalidateSize({ animate: false, pan: false });
      const size = map.getSize();
      const marker = markers.current.get(selectedId);
      const group = clusterRef.current;
      const parent = marker ? (marker as L.Marker & { __parent?: unknown }).__parent : undefined;
      if (size.x < 40 || size.y < 40 || !marker || !parent) {
        if (attempts < 24) retryTimer = window.setTimeout(tryReveal, 50);
        else focusLock.current = false;
        return;
      }
      fittedKey.current = boundsKey;
      const reduced = prefersReducedMotion();
      try {
        if (group && !reduced) group.zoomToShowLayer(marker, () => finish(marker));
        else {
          map.setView(marker.getLatLng(), 16, { animate: false });
          finish(marker);
        }
      } catch {
        map.setView(marker.getLatLng(), 16, { animate: false });
        finish(marker);
      }
      fallbackTimer = window.setTimeout(() => {
        if (!opened) {
          map.invalidateSize({ animate: false, pan: false });
          map.setView(marker.getLatLng(), 16, { animate: false });
          finish(marker);
        }
      }, 900);
    };
    retryTimer = window.setTimeout(tryReveal, 0);
    return () => {
      cancelled = true;
      focusLock.current = false;
      window.clearTimeout(retryTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [active, boundsKey, clusterRef, focusOrigin, focusTick, map, markers, selectedId]);

  useEffect(() => {
    markers.current.forEach((marker, id) => {
      marker.getElement()?.querySelector(".pin")?.classList.toggle("pin--selected", id === selectedId || id === highlightId);
    });
  }, [highlightId, markers, selectedId]);

  useEffect(() => {
    if (!active || focusOrigin !== "map" || !selectedId) return;
    const marker = markers.current.get(selectedId);
    if (marker && !marker.isPopupOpen()) marker.openPopup();
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
        highlightId={highlightId}
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
          const marks = eventCategoryMarks(event);
          const page = hasEventPage(event);
          return (
            <Marker
              key={key}
              ref={(marker) => {
                if (marker) markers.current.set(key, marker);
                else markers.current.delete(key);
              }}
              eventHandlers={{
                click: (leafletEvent) => {
                  const marker = leafletEvent.target as L.Marker;
                  marker.openPopup();
                  onSelect(key);
                },
              }}
              icon={markerIcon(event)}
              position={[event.lat, event.lng]}
            >
              <Popup autoPan autoPanPadding={[12, 16]} maxWidth={272}>
                <div
                  className="map-popup"
                  onClick={(eventClick) => eventClick.stopPropagation()}
                  onPointerDown={(eventClick) => eventClick.stopPropagation()}
                >
                  <p className="map-popup__title">{event.title}</p>
                  <p className="map-popup__meta">
                    <span aria-hidden="true">{marks.map((mark) => mark.icon).join("")}</span> {formatPopupWhen(event)}
                  </p>
                  <p className="map-popup__place">{event.place}</p>
                  <p className="map-popup__age">{event.age}</p>
                  {event.description.trim() ? <p className="map-popup__desc">{event.description}</p> : null}
                  <div className="map-popup__icons">
                    {page ? (
                      <a
                        aria-label="Strona wydarzenia"
                        className="map-popup__icon"
                        href={event.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Strona wydarzenia"
                      >
                        <ExternalLink aria-hidden size={20} strokeWidth={2} />
                      </a>
                    ) : null}
                    {canRoute(event) ? <TransitMenu event={event} /> : null}
                    <CalendarMenu event={event} today={today} />
                    <button
                      aria-label="Pokaż na liście"
                      className="map-popup__icon"
                      title="Pokaż na liście"
                      type="button"
                      onClick={() => onShowInList(key)}
                    >
                      <List aria-hidden size={20} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
