export const AREAS = ["Oerlikon", "Zurych", "Okolice", "Winterthur"] as const;
export type Area = (typeof AREAS)[number];

export const CATEGORIES = [
  "teatr",
  "muzyka",
  "sport",
  "zwierzęta/natura",
  "warsztaty",
  "biblioteka",
  "campy/ferie",
  "festyny",
  "stałe",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface KidsEvent {
  dateText: string;
  /** ISO date (YYYY-MM-DD). Null marks a recurring offering. */
  startDate: string | null;
  /** Last day the listing should stay visible. Omit for a single day. */
  endDate?: string | null;
  title: string;
  url: string;
  description: string;
  age: string;
  place: string;
  area: Area;
  category: Category;
  registration: string;
  isNew: boolean;
  /** WGS84 latitude of the venue. */
  lat: number;
  /** WGS84 longitude of the venue. */
  lng: number;
  /** Path under public/, for example images/fallback-books.jpg. */
  image: string;
}

export interface EventsFile {
  updatedAt: string;
  events: KidsEvent[];
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface SourceItem {
  name: string;
  detail: string;
  links: SourceLink[];
}

export interface SourceSection {
  title: string;
  intro: string;
  items: SourceItem[];
}

export interface SourcesFile {
  sections: SourceSection[];
}

export interface EventFilters {
  query: string;
  areas: Area[];
  categories: Category[];
  age: number | null;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}
