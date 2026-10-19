import { Button, Checkbox } from "@heroui/react";
import { ageOptionLabel, categoryLabel } from "../lib/format";
import { AREAS, CATEGORIES, type Area, type Category } from "../types";

const AGES = [2, 3, 4, 5, 6, 7, 8] as const;

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
  areas,
  categories,
  age,
  onlyVisible,
  canClear,
  onAreas,
  onCategories,
  onAge,
  onOnlyVisible,
  onClear,
}: {
  areas: Area[];
  categories: Category[];
  age: number | null;
  onlyVisible: boolean;
  canClear: boolean;
  onAreas: (areas: Area[]) => void;
  onCategories: (categories: Category[]) => void;
  onAge: (age: number | null) => void;
  onOnlyVisible: (value: boolean) => void;
  onClear: () => void;
}) {
  return (
    <aside className="filters-pane">
      <div className="filters-head">
        <h2>Filtry</h2>
        {canClear ? (
          <Button size="sm" variant="ghost" onPress={onClear}>
            Wyczyść
          </Button>
        ) : null}
      </div>

      <fieldset className="filter-block">
        <legend>Obszar</legend>
        {AREAS.map((area) => (
          <FilterCheck
            key={area}
            checked={areas.includes(area)}
            label={area}
            onChange={(checked) =>
              onAreas(checked ? [...areas, area] : areas.filter((item) => item !== area))
            }
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
              onCategories(
                checked ? [...categories, category] : categories.filter((item) => item !== category),
              )
            }
          />
        ))}
      </fieldset>

      <fieldset className="filter-block">
        <legend>Wiek dziecka</legend>
        {AGES.map((value) => (
          <FilterCheck
            key={value}
            checked={age === value}
            label={ageOptionLabel(value)}
            onChange={(checked) => onAge(checked ? value : null)}
          />
        ))}
        {age !== null ? (
          <p className="filter-note">„Rodziny” i brak podanego wieku zostają na liście.</p>
        ) : null}
      </fieldset>

      <fieldset className="filter-block">
        <legend>Mapa</legend>
        <FilterCheck
          checked={onlyVisible}
          label="Tylko widoczny obszar mapy"
          onChange={onOnlyVisible}
        />
      </fieldset>
    </aside>
  );
}
