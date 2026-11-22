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
  /**
   * `single` is one calendar day (a time, or several times that day, still counts).
   * `recurring` is a course, a series of dates, a range longer than one day, or a regular offer.
   * Missing values are classified in code from the dates and the description.
   */
  recurrence?: "single" | "recurring";
  title: string;
  url: string;
  description: string;
  age: string;
  /** Youngest age included. Null together with ageMax means the listing fits every age. */
  ageMin: number | null;
  /** Oldest age included. Null with a numeric ageMin means there is no upper limit. */
  ageMax: number | null;
  place: string;
  area: Area;
  category: Category;
  registration: string;
  isNew: boolean;
  /** Theme tags, for example `halloween`. Empty when the listing has no theme. */
  tags: string[];
  /** WGS84 latitude of the venue. */
  lat: number;
  /** WGS84 longitude of the venue. */
  lng: number;
  /** Path under public/, for example images/fallback-books.jpg. */
  image: string;
}

/** A themed shortcut, for example a seasonal tag. Shown only while `until` is still current. */
export interface EventHighlight {
  tag: string;
  label: string;
  /** Last day the shortcut may appear, inclusive, as YYYY-MM-DD. */
  until: string;
}

export interface EventsFile {
  updatedAt: string;
  /** Optional in the JSON file. Parsing always fills an array. */
  highlights: EventHighlight[];
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

export type AgeBandFilter = "under3" | "over3" | null;

/** `single` and `recurring` narrow the list. `all` keeps both. */
export type RecurrenceFilter = "single" | "recurring" | "all";

export type DateFilter =
  | { kind: "all" }
  | {
      kind:
        | "today"
        | "tomorrow"
        | "thisWeek"
        | "thisWeekend"
        | "nextWeek"
        | "nextMonth"
        | "rollingWeek"
        | "rollingMonth";
    }
  | { kind: "custom"; from: string; to: string };

export interface EventFilters {
  query: string;
  areas: Area[];
  categories: Category[];
  age: AgeBandFilter;
  date: DateFilter;
  /** Event must carry at least one of these tags. Empty means no theme filter. */
  tags: string[];
  /** Default view is one-day events. */
  recurrence: RecurrenceFilter;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}
