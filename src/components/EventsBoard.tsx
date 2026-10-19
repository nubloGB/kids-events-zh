import {
  Button,
  EmptyState,
  Label,
  ListBox,
  SearchField,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { useMemo, useState, type Key } from "react";
import { EventCard } from "./EventCard";
import { EventTable } from "./EventTable";
import { ageOptionLabel, categoryLabel, countLabel } from "../lib/format";
import {
  EMPTY_FILTERS,
  eventKey,
  filtersAreActive,
  partitionEvents,
} from "../lib/events";
import { AREAS, CATEGORIES, type EventFilters, type KidsEvent } from "../types";

const AGE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

type ViewMode = "karty" | "tabela";

function selectedList<T extends string>(keys: Set<Key>, allowed: readonly T[]): T[] {
  return [...keys].map(String).filter((key): key is T => (allowed as readonly string[]).includes(key));
}

export function EventsBoard({ events, today }: { events: KidsEvent[]; today: string }) {
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS);
  const [view, setView] = useState<ViewMode>("karty");
  const { upcoming, recurring } = useMemo(
    () => partitionEvents(events, today, filters),
    [events, today, filters],
  );
  const active = filtersAreActive(filters);
  const nothing = upcoming.length === 0 && recurring.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface sm:p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchField
          aria-label="Szukaj wydarzeń"
          value={filters.query}
          onChange={(query) => setFilters((current) => ({ ...current, query }))}
          variant="secondary"
        >
          <Label>Szukaj</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Tytuł, miejsce, opis…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
          <div>
            <p id="area-label" className="mb-2 text-sm font-semibold">
              Obszar
            </p>
            <ToggleButtonGroup
              aria-labelledby="area-label"
              className="filter-group"
              isDetached
              selectedKeys={filters.areas}
              selectionMode="multiple"
              size="sm"
              onSelectionChange={(keys) =>
                setFilters((current) => ({ ...current, areas: selectedList(keys, AREAS) }))
              }
            >
              {AREAS.map((area) => (
                <ToggleButton key={area} id={area}>
                  {area}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          <Select
            aria-label="Wiek dziecka"
            className="w-full"
            placeholder="Każdy wiek"
            value={filters.age === null ? "all" : String(filters.age)}
            variant="secondary"
            onChange={(key) =>
              setFilters((current) => ({
                ...current,
                age: key == null || key === "all" ? null : Number(key),
              }))
            }
          >
            <Label>Wiek dziecka</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="Każdy wiek">
                  Każdy wiek
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {AGE_OPTIONS.map((age) => (
                  <ListBox.Item key={age} id={String(age)} textValue={ageOptionLabel(age)}>
                    {ageOptionLabel(age)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div>
          <p id="category-label" className="mb-2 text-sm font-semibold">
            Kategoria
          </p>
          <ToggleButtonGroup
            aria-labelledby="category-label"
            className="filter-group"
            isDetached
            selectedKeys={filters.categories}
            selectionMode="multiple"
            size="sm"
            onSelectionChange={(keys) =>
              setFilters((current) => ({
                ...current,
                categories: selectedList(keys, CATEGORIES),
              }))
            }
          >
            {CATEGORIES.map((category) => (
              <ToggleButton key={category} id={category}>
                {categoryLabel(category)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        {filters.age !== null ? (
          <p className="text-sm text-muted">
            Wydarzenia opisane jako „rodziny” albo bez podanego wieku zostają na liście.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm">
            {countLabel(upcoming.length, "nadchodzące wydarzenie", "nadchodzące wydarzenia", "nadchodzących wydarzeń")}
            {" · "}
            {countLabel(recurring.length, "stałe zajęcie", "stałe zajęcia", "stałych zajęć")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {active ? (
              <Button size="sm" variant="ghost" onPress={() => setFilters(EMPTY_FILTERS)}>
                Wyczyść filtry
              </Button>
            ) : null}
            <ToggleButtonGroup
              aria-label="Widok listy"
              disallowEmptySelection
              selectedKeys={[view]}
              selectionMode="single"
              size="sm"
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next === "karty" || next === "tabela") setView(next);
              }}
            >
              <ToggleButton id="karty">Karty</ToggleButton>
              <ToggleButton id="tabela">Tabela</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </form>

      {nothing ? (
        <EmptyState className="rounded-3xl bg-surface px-6 py-12 text-center">
          <p className="font-display text-2xl text-foreground">Nic nie pasuje do filtrów</p>
          <p className="mt-2">Zmień obszar, kategorię albo wiek — albo wyczyść wyszukiwanie.</p>
          <Button className="mt-4" variant="secondary" onPress={() => setFilters(EMPTY_FILTERS)}>
            Wyczyść filtry
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-10">
          <EventSection
            events={upcoming}
            heading="Nadchodzące"
            id="nadchodzace"
            intro="Posortowane od najbliższego terminu. Minione dni znikają same."
            today={today}
            view={view}
          />
          <EventSection
            events={recurring}
            heading="Stałe zajęcia"
            id="stale-zajecia"
            intro="Bez jednej daty: cotygodniowe godziny, terminy na życzenie i miejsca otwarte cały czas."
            today={today}
            view={view}
          />
        </div>
      )}
    </div>
  );
}

function EventSection({
  id,
  heading,
  intro,
  events,
  view,
  today,
}: {
  id: string;
  heading: string;
  intro: string;
  events: KidsEvent[];
  view: ViewMode;
  today: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="font-display text-3xl">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted">{intro}</p>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted">Brak pozycji w tej sekcji dla wybranych filtrów.</p>
      ) : view === "karty" ? (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <li key={eventKey(event)}>
              <EventCard event={event} today={today} />
            </li>
          ))}
        </ul>
      ) : (
        <EventTable events={events} label={heading} today={today} />
      )}
    </section>
  );
}
