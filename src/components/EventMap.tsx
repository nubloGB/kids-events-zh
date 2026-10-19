import L from "leaflet";
import { useEffect, useRef, type MutableRefObject } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CalendarMenu } from "./CalendarMenu";
import { eventKey } from "../lib/events";
import { CATEGORY_COLOR, CATEGORY_GLYPH } from "../lib/markers";
import type { KidsEvent, MapBounds } from "../types";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

const OERLIKON: L.LatLngExpression = [47.411, 8.544];

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(event: KidsEvent, selected: boolean): L.DivIcon {
  const key = `${event.category}:${selected ? "1" : "0"}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const size = selected ? 44 : 34;
  const icon = L.divIcon({
    className: "pin-wrap",
    html: `<span class="pin${selected ? " pin--selected" : ""}" style="--pin:${CATEGORY_COLOR[event.category]}"><span>${CATEGORY_GLYPH[event.category]}</span></span>`,
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
  });
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

function MapBridge({
  active,
  selectedId,
  focusTick,
  focusOrigin,
  markers,
  clusterRef,
  onBounds,
}: {
  active: boolean;
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
  const fitted = useRef(false);
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
    if (!active) return;
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      if (!fitted.current) {
        map.setView(OERLIKON, 13);
        fitted.current = true;
      }
      publish();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [active, map]);

  useEffect(() => {
    if (!active || focusOrigin !== "list" || !selectedId) return;
    const marker = markers.current.get(selectedId);
    const group = clusterRef.current;
    if (!marker || !group) return;
    const reveal = () => {
      map.invalidateSize();
      marker.openPopup();
    };
    try {
      group.zoomToShowLayer(marker, reveal);
    } catch {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.45 });
      window.setTimeout(reveal, 480);
    }
  }, [active, clusterRef, focusOrigin, focusTick, map, markers, selectedId]);

  return null;
}

export function EventMap({
  events,
  today,
  selectedId,
  focusTick,
  focusOrigin,
  active,
  onSelect,
  onBounds,
}: {
  events: KidsEvent[];
  today: string;
  selectedId: string | null;
  focusTick: number;
  focusOrigin: "list" | "map";
  active: boolean;
  onSelect: (id: string) => void;
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
          const selected = key === selectedId;
          return (
            <Marker
              key={key}
              ref={(marker) => {
                if (marker) markers.current.set(key, marker);
                else markers.current.delete(key);
              }}
              eventHandlers={{
                click: () => onSelect(key),
              }}
              icon={markerIcon(event, selected)}
              position={[event.lat, event.lng]}
              zIndexOffset={selected ? 800 : 0}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{event.title}</strong>
                  <p>{event.dateText}</p>
                  <p>{event.place}</p>
                  <a href={event.url} rel="noopener noreferrer" target="_blank">
                    Strona wydarzenia
                  </a>
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
