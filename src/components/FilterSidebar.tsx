import { Button, Checkbox } from "@heroui/react";
import { formatRange, normalizeRange, presetRange, type DatePreset } from "../lib/dates";
import { categoryLabel } from "../lib/format";
import { AREAS, CATEGORIES, type AgeBandFilter, type Area, type Category, type DateFilter } from "../types";

const DATE_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "Wszystkie daty" },
  { id: "today", label: "Dziś" },
  { id: "tomorrow", label: "Jutro" },
  { id: "thisWeek", label: "Ten tydzień" },
  { id: "thisWeekend", label: "Ten weekend" },
  { id: "nextWeek", label: "Następny tydzień" },
  { id: "nextMonth", label: "Następny miesiąc" },
  { id: "custom", label: "Inny zakres dat" },
];

const AGE_OPTIONS: { id: AgeBandFilter; label: string }[] = [
  { id: null, label: "Wszystkie" },
  { id: "under3", label: "Do 3 lat" },
  { id: "over3", label: "Powyżej 3 lat" },
];

function FilterCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Checkbox className="filter-check" isSelected={checked} onChange={onChange}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span>{label}</span>
      </Checkbox.Content>
    </Checkbox>
  );
}

export function FilterSidebar({
  today,
  areas,
  categories,
  age,
  date,
  tags,
  customFrom,
  customTo,
  onlyVisible,
  canClear,
  onAreas,
  onCategories,
  onAge,
  onDate,
  onTags,
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
  customFrom: string;
  customTo: string;
  onlyVisible: boolean;
  canClear: boolean;
  onAreas: (areas: Area[]) => void;
  onCategories: (categories: Category[]) => void;
  onAge: (age: AgeBandFilter) => void;
  onDate: (date: DateFilter) => void;
  onTags: (tags: string[]) => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  onOnlyVisible: (value: boolean) => void;
  onClear: () => void;
}) {
  const customRange = normalizeRange(customFrom, customTo);

  return (
    <aside className="filters-pane">
      <button
        type="button"
        className={tags.includes("halloween") ? "halloween-toggle is-selected" : "halloween-toggle"}
        aria-pressed={tags.includes("halloween")}
        onClick={() =>
          onTags(
            tags.includes("halloween") ? tags.filter((tag) => tag !== "halloween") : [...tags, "halloween"],
          )
        }
      >
        Halloween 🎃
      </button>

      <div className="filters-head">
        <h2>Filtry</h2>
        {canClear ? (
          <Button size="sm" variant="ghost" onPress={onClear}>
            Wyczyść
          </Button>
        ) : null}
      </div>

      <fieldset className="filter-block">
        <legend>Data</legend>
        <div aria-label="Data" className="option-list" role="radiogroup">
          {DATE_OPTIONS.map((option) => {
            const selected = date.kind === option.id;
            const range =
              option.id === "all"
                ? null
                : option.id === "custom"
                  ? customRange
                    ? formatRange(customRange)
                    : null
                  : formatRange(presetRange(option.id, today));
            return (
              <button
                key={option.id}
                aria-checked={selected}
                className={selected ? "choice-option is-selected" : "choice-option"}
                role="radio"
                type="button"
                onClick={() =>
                  onDate(option.id === "custom" ? { kind: "custom", from: customFrom, to: customTo } : { kind: option.id })
                }
              >
                <span>{option.label}</span>
                {range ? <span className="choice-option__meta">{range}</span> : null}
              </button>
            );
          })}
        </div>
        {date.kind === "custom" ? (
          <div className="date-range-fields">
            <label>
              Od
              <input
                type="date"
                value={customFrom}
                onChange={(event) => {
                  onCustomFrom(event.target.value);
                  onDate({ kind: "custom", from: event.target.value, to: customTo });
                }}
              />
            </label>
            <label>
              Do
              <input
                type="date"
                value={customTo}
                onChange={(event) => {
                  onCustomTo(event.target.value);
                  onDate({ kind: "custom", from: customFrom, to: event.target.value });
                }}
              />
            </label>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="filter-block">
        <legend>Wiek dziecka</legend>
        <div aria-label="Wiek dziecka" className="option-list" role="radiogroup">
          {AGE_OPTIONS.map((option) => {
            const selected = age === option.id;
            return (
              <button
                key={option.label}
                aria-checked={selected}
                className={selected ? "choice-option is-selected" : "choice-option"}
                role="radio"
                type="button"
                onClick={() => onAge(option.id)}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        {age !== null ? <p className="filter-note">„Rodziny” i brak podanego wieku zostają na liście.</p> : null}
      </fieldset>

      <fieldset className="filter-block">
        <legend>Obszar</legend>
        {AREAS.map((area) => (
          <FilterCheck
            key={area}
            checked={areas.includes(area)}
            label={area}
            onChange={(checked) => onAreas(checked ? [...areas, area] : areas.filter((item) => item !== area))}
          />
        ))}
      </fieldset>

      <fieldset className="filter-block">
        <legend>Kategoria</legend>
        {CATEGORIES.map((category) => (
          <FilterCheck
            key={category}
            checked={categories.includes(category)}
            label={categoryLabel(category)}
            onChange={(checked) =>
              onCategories(checked ? [...categories, category] : categories.filter((item) => item !== category))
            }
          />
        ))}
      </fieldset>

      <fieldset className="filter-block">
        <legend>Mapa</legend>
        <FilterCheck checked={onlyVisible} label="Tylko widoczny obszar mapy" onChange={onOnlyVisible} />
      </fieldset>
    </aside>
  );
}
