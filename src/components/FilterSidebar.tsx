import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { formatCompactRange, normalizeRange, presetRange, type DatePreset } from "../lib/dates";
import { categoryCatalog } from "../lib/markers";
import {
  AREAS,
  type AgeBandFilter,
  type Area,
  type Category,
  type DateFilter,
  type EventHighlight,
  type RecurrenceFilter,
} from "../types";

const DATE_OPTIONS: { id: Exclude<DatePreset, "thisWeek" | "rollingMonth">; name: string }[] = [
  { id: "all", name: "Wszystkie daty" },
  { id: "today", name: "Dziś" },
  { id: "tomorrow", name: "Jutro" },
  { id: "rollingWeek", name: "Ten tydzień" },
  { id: "thisWeekend", name: "Ten weekend" },
  { id: "nextWeek", name: "Następny tydzień" },
  { id: "nextMonth", name: "Następny miesiąc" },
  { id: "custom", name: "Inny zakres" },
];

const AGE_OPTIONS: { id: AgeBandFilter; label: string }[] = [
  { id: null, label: "Wszystkie" },
  { id: "under3", label: "Do 3 lat" },
  { id: "over3", label: "Powyżej 3 lat" },
];

const RECURRENCE_OPTIONS: { id: RecurrenceFilter; label: string }[] = [
  { id: "single", label: "Jednodniowe" },
  { id: "recurring", label: "Cykliczne" },
  { id: "all", label: "Wszystkie" },
];

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function useHasMore(ref: RefObject<HTMLElement | null>, watch: unknown): boolean {
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const overflow = element.scrollHeight - element.clientHeight > 2;
      const notAtEnd = element.scrollTop + element.clientHeight < element.scrollHeight - 2;
      setHasMore(overflow && notAtEnd);
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref, watch]);
  return hasMore;
}

function stepIndex(index: number, length: number, key: string): number | null {
  if (length === 0) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return (index + 1) % length;
  if (key === "ArrowLeft" || key === "ArrowUp") return (index - 1 + length) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return null;
}

function FilterSection({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={className ? `filter-block ${className}` : "filter-block"}>
      <legend>{label}</legend>
      {children}
    </fieldset>
  );
}

function ChipCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={checked ? "filter-chip is-selected" : "filter-chip"}
      role="checkbox"
      type="button"
      onClick={() => onChange(!checked)}
    >
      {label}
    </button>
  );
}

function ChipRadios<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.id === value);

  return (
    <div
      aria-label={label}
      className="chip-list"
      role="radiogroup"
      onKeyDown={(event) => {
        const next = stepIndex(selectedIndex < 0 ? 0 : selectedIndex, options.length, event.key);
        if (next === null) return;
        event.preventDefault();
        onChange(options[next].id);
        refs.current[next]?.focus();
      }}
    >
      {options.map((option, index) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            aria-checked={selected}
            className={selected ? "filter-chip is-selected" : "filter-chip"}
            role="radio"
            tabIndex={selected || (selectedIndex < 0 && index === 0) ? 0 : -1}
            type="button"
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function sidebarDateValue(kind: DateFilter["kind"]): (typeof DATE_OPTIONS)[number]["id"] | null {
  for (const option of DATE_OPTIONS) {
    if (option.id === kind) return option.id;
  }
  return null;
}

function dateChoiceLabel(
  option: (typeof DATE_OPTIONS)[number],
  today: string,
  customFrom: string,
  customTo: string,
): string {
  if (option.id === "all") return option.name;
  if (option.id === "custom") {
    const range = normalizeRange(customFrom, customTo);
    return range ? `${option.name} ${formatCompactRange(range)}` : option.name;
  }
  return `${option.name} ${formatCompactRange(presetRange(option.id, today))}`;
}

export function FilterSidebar({
  today,
  areas,
  categories,
  age,
  date,
  tags,
  recurrence,
  customFrom,
  customTo,
  onlyVisible,
  filterCount,
  shownCount,
  totalCount,
  highlights,
  variant = "sidebar",
  onAreas,
  onCategories,
  onAge,
  onDate,
  onTags,
  onRecurrence,
  onCustomFrom,
  onCustomTo,
  onOnlyVisible,
  onClear,
}: {
  today: string;
  areas: Area[];
  categories: Category[];
  age: AgeBandFilter;
  date: DateFilter;
  tags: string[];
  recurrence: RecurrenceFilter;
  customFrom: string;
  customTo: string;
  onlyVisible: boolean;
  filterCount: number;
  shownCount: number;
  totalCount: number;
  highlights: EventHighlight[];
  variant?: "sidebar" | "sheet";
  onAreas: (areas: Area[]) => void;
  onCategories: (categories: Category[]) => void;
  onAge: (age: AgeBandFilter) => void;
  onDate: (date: DateFilter) => void;
  onTags: (tags: string[]) => void;
  onRecurrence: (recurrence: RecurrenceFilter) => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  onOnlyVisible: (value: boolean) => void;
  onClear: () => void;
}) {
  const shortViewport = useMedia("(max-height: 860px)");
  const foldExtras = variant === "sidebar" && shortViewport;
  const [moreOpen, setMoreOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const paneRef = useRef<HTMLElement>(null);
  const dateBlockRef = useRef<HTMLFieldSetElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const showExtras = !foldExtras || moreOpen;
  const hasMore = useHasMore(paneRef, `${foldExtras}:${moreOpen}:${highlights.length}:${date.kind}`);

  useEffect(() => {
    if (date.kind !== "custom") setCustomOpen(false);
  }, [date.kind]);

  useEffect(() => {
    if (!customOpen) return;
    const block = dateBlockRef.current;
    const bounds = block?.closest(".filters-pane, .phone-filter-dialog")?.getBoundingClientRect();
    if (block) {
      const rect = block.getBoundingClientRect();
      const bottom = bounds?.bottom ?? window.innerHeight;
      const top = bounds?.top ?? 0;
      setOpenUp(bottom - rect.bottom < 160 && rect.top - top > 160);
    }
    fromRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCustomOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (dateBlockRef.current?.contains(target)) return;
      setCustomOpen(false);
    };
    const scroller = block?.closest(".filters-pane, .drawer__body");
    const onScroll = () => setCustomOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      scroller?.removeEventListener("scroll", onScroll);
    };
  }, [customOpen]);

  function selectDate(id: (typeof DATE_OPTIONS)[number]["id"]) {
    if (id === "custom") {
      onDate({ kind: "custom", from: customFrom, to: customTo });
      setCustomOpen((open) => date.kind !== "custom" || !open);
      return;
    }
    setCustomOpen(false);
    onDate({ kind: id });
  }

  const areaSection = (
    <FilterSection label="Obszar">
      <div aria-label="Obszar" className="chip-list" role="group">
        {AREAS.map((area) => (
          <ChipCheck
            key={area}
            checked={areas.includes(area)}
            label={area}
            onChange={(checked) => onAreas(checked ? [...areas, area] : areas.filter((item) => item !== area))}
          />
        ))}
      </div>
    </FilterSection>
  );

  const mapSection = (
    <FilterSection label="Mapa">
      <div aria-label="Mapa" className="chip-list" role="group">
        <ChipCheck checked={onlyVisible} label="Tylko widoczny obszar mapy" onChange={onOnlyVisible} />
      </div>
    </FilterSection>
  );

  return (
    <aside
      ref={variant === "sidebar" ? paneRef : undefined}
      className={variant === "sheet" ? "filters-sheet" : hasMore ? "filters-pane has-more" : "filters-pane"}
    >
      {variant === "sidebar" ? (
        <div className="filters-head">
          <h2>Filtry</h2>
          <button className="filters-clear" type="button" onClick={onClear}>
            Wyczyść
            {filterCount > 0 ? <span className="filters-clear__count">{filterCount}</span> : null}
          </button>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <FilterSection label="Wyróżnienie">
          <div aria-label="Wyróżnienie" className="chip-list" role="group">
            {highlights.map((highlight) => (
              <ChipCheck
                key={highlight.tag}
                checked={tags.includes(highlight.tag)}
                label={highlight.label}
                onChange={(checked) =>
                  onTags(checked ? [...tags, highlight.tag] : tags.filter((tag) => tag !== highlight.tag))
                }
              />
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection label="Rodzaj">
        <ChipRadios
          label="Rodzaj"
          options={RECURRENCE_OPTIONS}
          value={recurrence}
          onChange={onRecurrence}
        />
      </FilterSection>

      <fieldset className="filter-block filter-block--date" ref={dateBlockRef}>
        <legend>Data</legend>
        <ChipRadios
          label="Data"
          options={DATE_OPTIONS.map((option) => ({
            id: option.id,
            label: dateChoiceLabel(option, today, customFrom, customTo),
          }))}
          value={sidebarDateValue(date.kind)}
          onChange={selectDate}
        />
        {customOpen ? (
          <div className={openUp ? "date-popover is-up" : "date-popover"} role="dialog" aria-label="Inny zakres dat">
            <label>
              Od
              <input ref={fromRef} type="date" value={customFrom} onChange={(event) => onCustomFrom(event.target.value)} />
            </label>
            <label>
              Do
              <input type="date" value={customTo} onChange={(event) => onCustomTo(event.target.value)} />
            </label>
          </div>
        ) : null}
      </fieldset>

      <FilterSection label="Wiek">
        <ChipRadios
          label="Wiek"
          options={AGE_OPTIONS.map((option) => ({ id: option.label, label: option.label }))}
          value={AGE_OPTIONS.find((option) => option.id === age)?.label ?? null}
          onChange={(label) => onAge(AGE_OPTIONS.find((option) => option.label === label)?.id ?? null)}
        />
      </FilterSection>

      {foldExtras ? null : areaSection}

      <FilterSection label="Kategoria">
        <div aria-label="Kategoria" className="chip-list" role="group">
          {categoryCatalog().map((category) => (
            <ChipCheck
              key={category.id}
              checked={categories.includes(category.id)}
              label={`${category.icon} ${category.label}`}
              onChange={(checked) =>
                onCategories(checked ? [...categories, category.id] : categories.filter((item) => item !== category.id))
              }
            />
          ))}
        </div>
      </FilterSection>

      {foldExtras ? (
        <>
          <button
            aria-controls="more-filters"
            aria-expanded={showExtras}
            className="filter-more"
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
          >
            Więcej filtrów
          </button>
          <div hidden={!showExtras} id="more-filters">
            {showExtras ? (
              <>
                {areaSection}
                {mapSection}
              </>
            ) : null}
          </div>
        </>
      ) : (
        mapSection
      )}

      {variant === "sidebar" ? (
        <>
          <div aria-hidden="true" className="filters-fade" />
          <p aria-live="polite" className="filters-foot">
            {shownCount} z {totalCount} {totalCount === 1 ? "wydarzenia" : "wydarzeń"}
          </p>
        </>
      ) : null}
    </aside>
  );
}
