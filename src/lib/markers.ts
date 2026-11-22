import type { EventCategory } from "../types";

/** Used when `events.json` has no `categories` array. */
export const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: "teatr", label: "Teatr", icon: "🎭", color: "#c026d3", image: "images/fallback-stage.jpg", order: 1 },
  { id: "muzyka", label: "Muzyka", icon: "🎵", color: "#7c3aed", image: "images/fallback-music.jpg", order: 2 },
  { id: "sport", label: "Sport", icon: "⚽", color: "#ea580c", image: "images/fallback-athletics.jpg", order: 3 },
  { id: "zwierzęta/natura", label: "Zwierzęta/natura", icon: "🐾", color: "#059669", image: "images/fallback-zoo.jpg", order: 4 },
  { id: "warsztaty", label: "Warsztaty", icon: "🎨", color: "#db2777", image: "images/fallback-crafts.jpg", order: 5 },
  { id: "biblioteka", label: "Biblioteka", icon: "📚", color: "#2563eb", image: "images/fallback-books.jpg", order: 6 },
  { id: "campy/ferie", label: "Campy/ferie", icon: "🏕️", color: "#d97706", image: "images/fallback-athletics.jpg", order: 7 },
  { id: "festyny", label: "Festyny", icon: "🎈", color: "#e11d48", image: "images/fallback-playground.jpg", order: 8 },
  { id: "stałe", label: "Stałe", icon: "🔁", color: "#6d28d9", image: "images/fallback-playground.jpg", order: 9 },
];

const FALLBACK_ICON = "📍";
const FALLBACK_COLOR = "#64748b";
const FALLBACK_IMAGE = "images/fallback-playground.jpg";

let catalog: EventCategory[] = DEFAULT_CATEGORIES;

export function installCategories(categories: EventCategory[]): EventCategory[] {
  catalog = [...categories].sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, "pl"));
  return catalog;
}

export function categoryCatalog(): EventCategory[] {
  return catalog;
}

export interface CategoryMark {
  id: string;
  label: string;
  icon: string;
}

/**
 * Up to two icons. A seasonal tag such as `swieta` comes first, then the event's own category.
 * An unknown id falls back to 📍.
 */
export function eventCategoryMarks(event: { category: string; tags: string[] }): CategoryMark[] {
  const known = new Set(catalog.map((category) => category.id));
  const ids: string[] = [];
  const add = (id: string) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  if (event.tags.includes("swieta")) add("swieta");
  add(event.category);
  for (const tag of event.tags) {
    if (known.has(tag)) add(tag);
  }
  return ids.slice(0, 2).map((id) => {
    const look = categoryAppearance(id);
    return { id, label: look.label, icon: look.icon };
  });
}

export function categoryAppearance(id: string): { label: string; icon: string; color: string; image: string } {
  const found = catalog.find((category) => category.id === id);
  if (found) {
    return {
      label: found.label,
      icon: found.icon,
      color: found.color,
      image: found.image || FALLBACK_IMAGE,
    };
  }
  const label = id.length === 0 ? id : id.charAt(0).toLocaleUpperCase("pl") + id.slice(1);
  return { label, icon: FALLBACK_ICON, color: FALLBACK_COLOR, image: FALLBACK_IMAGE };
}
