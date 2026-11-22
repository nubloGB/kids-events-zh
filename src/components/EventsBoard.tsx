import { Button, Drawer, EmptyState, SearchField, useOverlayState } from "@heroui/react";
import { ArrowLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { DaySlider } from "./DaySlider";
import { EventCard } from "./EventCard";
import { EventMap } from "./EventMap";
import { FilterSidebar } from "./FilterSidebar";
import { UpdatedNote } from "./UpdatedNote";
import { useDateFilter } from "../lib/dateFilterContext";
import { countLabel } from "../lib/format";
import { EMPTY_FILTERS, activeFilterCount, eventKey, isInsideBounds, partitionEvents, visibleHighlights } from "../lib/events";
import type { AgeBandFilter, Area, Category, EventHighlight, KidsEvent, MapBounds, RecurrenceFilter } from "../types";

function useMedia(query: string): boolean {
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
  highlights: highlightSource,
  query,
  updatedAt,
  onQueryChange,
}: {
  events: KidsEvent[];
  highlights: EventHighlight[];
  query: string;
  updatedAt: string;
  onQueryChange: (query: string) => void;
}) {
  const wide = useMedia("(min-width: 901px)");
  const phone = useMedia("(max-width: 639px)");
  const { today, date, customFrom, customTo, setDate, setCustomFrom, setCustomTo, clearDate } = useDateFilter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [age, setAge] = useState<AgeBandFilter>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceFilter>("single");
  const [onlyVisible, setOnlyVisible] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"lista" | "mapa">("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusOrigin, setFocusOrigin] = useState<"list" | "map">("list");
  const [focusTick, setFocusTick] = useState(0);
  const [draft, setDraft] = useState(query);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const draftRef = useRef(query);
  const committedRef = useRef(query);

  const filters = useMemo(
    () => ({ query, areas, categories, age, date, tags, recurrence }),
    [age, areas, categories, date, query, recurrence, tags],
  );
  const { upcoming, recurring } = useMemo(
    () => partitionEvents(events, today, filters),
    [events, today, filters],
  );
  const totalCount = useMemo(() => {
    const all = partitionEvents(events, today, { ...EMPTY_FILTERS, recurrence: "all" });
    return all.upcoming.length + all.recurring.length;
  }, [events, today]);
  const liveHighlights = useMemo(
    () => visibleHighlights(highlightSource, events, today),
    [events, highlightSource, today],
  );

  const mapActive = wide || mobileView === "mapa";
  const limitToMap = onlyVisible && bounds !== null && mapActive;
  const inView = (list: KidsEvent[]) => (limitToMap && bounds ? list.filter((event) => isInsideBounds(event, bounds)) : list);
  const listUpcoming = inView(upcoming);
  const listRecurring = inView(recurring);
  const mapEvents = useMemo(() => [...listUpcoming, ...listRecurring], [listRecurring, listUpcoming]);
  const filterCount = activeFilterCount(filters, onlyVisible);
  const shownCount = listUpcoming.length + listRecurring.length;
  const listEmpty = listUpcoming.length === 0 && listRecurring.length === 0;
  const outsideFrame = listEmpty && upcoming.length + recurring.length > 0;
  const sheet = useOverlayState({ isOpen: phone && filtersOpen, onOpenChange: setFiltersOpen });

  const commitQuery = useCallback(
    (value: string) => {
      committedRef.current = value;
      onQueryChange(value);
    },
    [onQueryChange],
  );

  useEffect(() => {
    if (query === committedRef.current) return;
    committedRef.current = query;
    if (draftRef.current !== query) {
      draftRef.current = query;
      setDraft(query);
    }
  }, [query]);

  useEffect(() => {
    if (!phone) {
      if (draftRef.current !== committedRef.current) commitQuery(draftRef.current);
      return;
    }
    const value = draftRef.current;
    if (value === committedRef.current) return;
    if (value === "") {
      commitQuery("");
      return;
    }
    const id = window.setTimeout(() => {
      if (draftRef.current === value) commitQuery(value);
    }, 300);
    return () => window.clearTimeout(id);
  }, [commitQuery, draft, phone, query]);

  useEffect(() => {
    if (focusOrigin !== "map" || !selectedId) return;
    itemRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusOrigin, focusTick, selectedId]);

  useEffect(() => {
    if (!phone) return;
    const root = document.querySelector<HTMLElement>(".app-shell");
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      root.classList.toggle("is-header-stuck", root.scrollTop > 4);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.cancelAnimationFrame(frame);
      root.removeEventListener("scroll", onScroll);
      root.classList.remove("is-header-stuck", "is-view-hidden");
    };
  }, [phone]);

  function showOnMap(id: string) {
    setSelectedId(id);
    setFocusOrigin("list");
    setFocusTick((tick) => tick + 1);
    if (!wide) setMobileView("mapa");
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
    clearDate();
    setTags([]);
    setRecurrence("single");
    setOnlyVisible(false);
  }

  function onDraftChange(value: string) {
    draftRef.current = value;
    setDraft(value);
  }

  const sidebar = (variant: "sidebar" | "sheet") => (
    <FilterSidebar
      age={age}
      areas={areas}
      categories={categories}
      customFrom={customFrom}
      customTo={customTo}
      date={date}
      filterCount={filterCount}
      highlights={liveHighlights}
      onlyVisible={onlyVisible}
      recurrence={recurrence}
      shownCount={shownCount}
      tags={tags}
      today={today}
      totalCount={totalCount}
      variant={variant}
      onAge={setAge}
      onAreas={setAreas}
      onCategories={setCategories}
      onClear={clearFilters}
      onCustomFrom={setCustomFrom}
      onCustomTo={setCustomTo}
      onDate={setDate}
      onOnlyVisible={setOnlyVisible}
      onRecurrence={setRecurrence}
      onTags={setTags}
    />
  );

  return (
    <div className="workspace" data-filters-open={filtersOpen ? "true" : "false"} data-mobile-view={mobileView}>
      {phone ? (
        <PhoneBar
          draft={draft}
          filterCount={filterCount}
          mobileView={mobileView}
          sheet={sheet}
          shownCount={shownCount}
          sidebar={sidebar("sheet")}
          onClear={clearFilters}
          onDraftChange={onDraftChange}
          onMobileView={setMobileView}
          onSubmitSearch={() => commitQuery(draftRef.current)}
        />
      ) : (
        <>
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
          {sidebar("sidebar")}
        </>
      )}

      <section className="list-pane" id="lista" aria-label="Lista wydarzeń">
        <div className="list-head">
          <h2>Wydarzenia</h2>
          <p aria-hidden={phone ? true : undefined} aria-live={phone ? undefined : "polite"}>
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
                : "Zmień rodzaj, datę, obszar, kategorię, wiek albo wyczyść wyszukiwanie."}
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
              onHighlight={setHoveredId}
              onShowOnMap={showOnMap}
            />
            <EventSection
              events={listRecurring}
              heading="Stałe zajęcia"
              id="stale-zajecia"
              itemRefs={itemRefs}
              selectedId={selectedId}
              today={today}
              onHighlight={setHoveredId}
              onShowOnMap={showOnMap}
            />
          </div>
        )}
        <UpdatedNote iso={updatedAt} />
      </section>

      <section className="map-pane" aria-label="Mapa wydarzeń">
        <EventMap
          active={mapActive}
          events={mapEvents}
          focusOrigin={focusOrigin}
          focusTick={focusTick}
          highlightId={hoveredId}
          selectedId={selectedId}
          today={today}
          onBounds={setBounds}
          onSelect={selectFromMap}
        />
      </section>
    </div>
  );
}

function PhoneBar({
  draft,
  filterCount,
  shownCount,
  mobileView,
  sheet,
  sidebar,
  onClear,
  onDraftChange,
  onMobileView,
  onSubmitSearch,
}: {
  draft: string;
  filterCount: number;
  shownCount: number;
  mobileView: "lista" | "mapa";
  sheet: ReturnType<typeof useOverlayState>;
  sidebar: ReactNode;
  onClear: () => void;
  onDraftChange: (value: string) => void;
  onMobileView: (view: "lista" | "mapa") => void;
  onSubmitSearch: () => void;
}) {
  const { today, date, setDate } = useDateFilter();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const filterLabel = `Filtry, ${countLabel(shownCount, "wynik", "wyniki", "wyników")}`;
  const queryActive = draft.trim() !== "";

  useEffect(() => {
    if (!searchOpen) return;
    document.querySelector<HTMLInputElement>(".phone-search-field input")?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    window.requestAnimationFrame(() => searchButtonRef.current?.focus());
  }

  return (
    <div className="phone-sticky" data-mobile-header="sticky">
      <div className={searchOpen ? "phone-search-row is-search-open" : "phone-search-row"}>
        {searchOpen ? (
          <button aria-label="Wróć" className="phone-search-button" type="button" onClick={closeSearch}>
            <ArrowLeft aria-hidden size={22} strokeWidth={2} />
          </button>
        ) : null}
        {searchOpen ? (
          <form
            className="phone-search-form"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitSearch();
            }}
          >
            <SearchField
              aria-label="Szukaj wydarzeń"
              className="phone-search-field"
              value={draft}
              variant="secondary"
              onChange={onDraftChange}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input enterKeyHint="search" placeholder="Tytuł, miejsce, opis…" />
                <SearchField.ClearButton aria-label="Wyczyść wyszukiwanie" />
              </SearchField.Group>
            </SearchField>
          </form>
        ) : (
          <DaySlider count={shownCount} date={date} today={today} onDate={setDate} />
        )}
        {searchOpen ? null : (
          <button
            ref={searchButtonRef}
            aria-expanded={false}
            aria-label={queryActive ? "Szukaj, jest wpisane zapytanie" : "Szukaj"}
            className="phone-search-button"
            type="button"
            onClick={() => setSearchOpen(true)}
          >
            <Search aria-hidden size={22} strokeWidth={2} />
            {queryActive ? <span aria-hidden="true" className="phone-search-dot" /> : null}
          </button>
        )}
        <Drawer state={sheet}>
          <Drawer.Trigger aria-label={filterLabel} className="phone-filter-button">
            <SlidersIcon />
            <span className="phone-filter-badge" aria-hidden="true">
              {shownCount}
            </span>
          </Drawer.Trigger>
          <Drawer.Backdrop variant="blur">
            <Drawer.Content placement="bottom">
              <Drawer.Dialog className="phone-filter-dialog">
                <Drawer.Handle />
                <Drawer.Header className="phone-sheet-header">
                  <Drawer.Heading>Filtry</Drawer.Heading>
                  <button className="sheet-clear" type="button" onClick={onClear}>
                    Wyczyść
                    {filterCount > 0 ? <span className="sheet-clear__count">{filterCount}</span> : null}
                  </button>
                  <Drawer.CloseTrigger aria-label="Zamknij filtry" className="phone-sheet-close" />
                </Drawer.Header>
                <Drawer.Body>{sidebar}</Drawer.Body>
                <Drawer.Footer className="phone-sheet-footer">
                  <button className="sheet-results" type="button" onClick={() => sheet.close()}>
                    {`Pokaż ${countLabel(shownCount, "wynik", "wyniki", "wyników")}`}
                  </button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      </div>
      <div className="phone-gap" />
      <div className="phone-view-slot">
        <div className="phone-view">
          <div aria-label="Lista lub mapa" className="view-toggle" role="group">
            <button
              className={mobileView === "lista" ? "is-active" : undefined}
              type="button"
              onClick={() => onMobileView("lista")}
            >
              Lista
            </button>
            <button
              className={mobileView === "mapa" ? "is-active" : undefined}
              type="button"
              onClick={() => onMobileView("mapa")}
            >
              Mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path
        d="M4 7h9.5M17.5 7H20M4 12h4.5M12.5 12H20M4 17h6.5M14.5 17H20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="15.5" cy="7" fill="white" r="2.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10.5" cy="12" fill="white" r="2.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12.5" cy="17" fill="white" r="2.1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EventSection({
  id,
  heading,
  events,
  today,
  selectedId,
  onHighlight,
  onShowOnMap,
  itemRefs,
}: {
  id: string;
  heading: string;
  events: KidsEvent[];
  today: string;
  selectedId: string | null;
  onHighlight: (id: string | null) => void;
  onShowOnMap: (id: string) => void;
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
              <EventCard
                event={event}
                selected={key === selectedId}
                today={today}
                onHighlight={(active) => onHighlight(active ? key : null)}
                onShowOnMap={() => onShowOnMap(key)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
