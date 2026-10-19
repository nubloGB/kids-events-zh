import { Button, EmptyState } from "@heroui/react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { EventCard } from "./EventCard";
import { EventMap } from "./EventMap";
import { FilterSidebar } from "./FilterSidebar";
import { countLabel } from "../lib/format";
import { eventKey, filtersAreActive, isInsideBounds, partitionEvents } from "../lib/events";
import type { Area, Category, KidsEvent, MapBounds } from "../types";

function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function EventsBoard({
  events,
  today,
  query,
  onQueryChange,
}: {
  events: KidsEvent[];
  today: string;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const wide = useMinWidth(901);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [age, setAge] = useState<number | null>(null);
  const [onlyVisible, setOnlyVisible] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"lista" | "mapa">("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusOrigin, setFocusOrigin] = useState<"list" | "map">("list");
  const [focusTick, setFocusTick] = useState(0);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const filters = useMemo(
    () => ({ query, areas, categories, age }),
    [age, areas, categories, query],
  );
  const { upcoming, recurring } = useMemo(
    () => partitionEvents(events, today, filters),
    [events, today, filters],
  );

  const mapActive = wide || mobileView === "mapa";
  const limitToMap = onlyVisible && bounds !== null && mapActive;
  const inView = (list: KidsEvent[]) => (limitToMap && bounds ? list.filter((event) => isInsideBounds(event, bounds)) : list);
  const listUpcoming = inView(upcoming);
  const listRecurring = inView(recurring);
  const mapEvents = useMemo(() => [...upcoming, ...recurring], [upcoming, recurring]);
  const active = filtersAreActive(filters) || onlyVisible;
  const listEmpty = listUpcoming.length === 0 && listRecurring.length === 0;
  const outsideFrame = listEmpty && upcoming.length + recurring.length > 0;

  useEffect(() => {
    if (focusOrigin !== "map" || !selectedId) return;
    itemRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusOrigin, focusTick, selectedId]);

  function selectFromList(id: string) {
    setSelectedId(id);
    setFocusOrigin("list");
    setFocusTick((tick) => tick + 1);
  }

  function selectFromMap(id: string) {
    setSelectedId(id);
    setFocusOrigin("map");
    setFocusTick((tick) => tick + 1);
    if (!wide) setMobileView("lista");
  }

  function clearFilters() {
    onQueryChange("");
    setAreas([]);
    setCategories([]);
    setAge(null);
    setOnlyVisible(false);
  }

  return (
    <div className="workspace" data-filters-open={filtersOpen ? "true" : "false"} data-mobile-view={mobileView}>
      <div className="mobile-toolbar">
        <div className="view-toggle" role="group" aria-label="Lista lub mapa">
          <button
            className={mobileView === "lista" ? "is-active" : undefined}
            type="button"
            onClick={() => setMobileView("lista")}
          >
            Lista
          </button>
          <button
            className={mobileView === "mapa" ? "is-active" : undefined}
            type="button"
            onClick={() => setMobileView("mapa")}
          >
            Mapa
          </button>
        </div>
        <Button size="sm" variant={filtersOpen ? "primary" : "secondary"} onPress={() => setFiltersOpen((open) => !open)}>
          Filtry
        </Button>
      </div>

      <FilterSidebar
        age={age}
        areas={areas}
        canClear={active}
        categories={categories}
        onlyVisible={onlyVisible}
        onAge={setAge}
        onAreas={setAreas}
        onCategories={setCategories}
        onClear={clearFilters}
        onOnlyVisible={setOnlyVisible}
      />

      <section className="list-pane" id="lista" aria-label="Lista wydarzeń">
        <div className="list-head">
          <h2>Wydarzenia</h2>
          <p aria-live="polite">
            {countLabel(listUpcoming.length, "nadchodzące", "nadchodzące", "nadchodzących")}
            {" · "}
            {countLabel(listRecurring.length, "stałe zajęcie", "stałe zajęcia", "stałych zajęć")}
            {limitToMap ? " w kadrze mapy" : ""}
          </p>
        </div>

        {listEmpty ? (
          <EmptyState className="empty-panel">
            <p className="font-display text-2xl text-foreground">
              {outsideFrame ? "Poza kadrem mapy" : "Nic nie pasuje"}
            </p>
            <p className="mt-2">
              {outsideFrame
                ? "Przesuń mapę albo wyłącz „Tylko widoczny obszar mapy”."
                : "Zmień obszar, kategorię, wiek albo wyczyść wyszukiwanie."}
            </p>
            <Button className="mt-4" variant="secondary" onPress={clearFilters}>
              Wyczyść filtry
            </Button>
          </EmptyState>
        ) : (
          <div className="list-sections">
            <EventSection
              events={listUpcoming}
              heading="Nadchodzące"
              id="nadchodzace"
              itemRefs={itemRefs}
              selectedId={selectedId}
              today={today}
              onSelect={selectFromList}
            />
            <EventSection
              events={listRecurring}
              heading="Stałe zajęcia"
              id="stale-zajecia"
              itemRefs={itemRefs}
              selectedId={selectedId}
              today={today}
              onSelect={selectFromList}
            />
          </div>
        )}
      </section>

      <section className="map-pane" aria-label="Mapa wydarzeń">
        <EventMap
          active={mapActive}
          events={mapEvents}
          focusOrigin={focusOrigin}
          focusTick={focusTick}
          selectedId={selectedId}
          onBounds={setBounds}
          onSelect={selectFromMap}
        />
      </section>
    </div>
  );
}

function EventSection({
  id,
  heading,
  events,
  today,
  selectedId,
  onSelect,
  itemRefs,
}: {
  id: string;
  heading: string;
  events: KidsEvent[];
  today: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  itemRefs: MutableRefObject<Map<string, HTMLLIElement>>;
}) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby={id} className="list-section">
      <h3 id={id}>{heading}</h3>
      <ul>
        {events.map((event) => {
          const key = eventKey(event);
          return (
            <li
              key={key}
              ref={(node) => {
                if (node) itemRefs.current.set(key, node);
                else itemRefs.current.delete(key);
              }}
            >
              <EventCard event={event} selected={key === selectedId} today={today} onSelect={() => onSelect(key)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
