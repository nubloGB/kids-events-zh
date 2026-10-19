import type { Category } from "../types";

export const CATEGORY_COLOR: Record<Category, string> = {
  teatr: "#c026d3",
  muzyka: "#7c3aed",
  sport: "#ea580c",
  "zwierzęta/natura": "#059669",
  warsztaty: "#db2777",
  biblioteka: "#2563eb",
  "campy/ferie": "#d97706",
  festyny: "#e11d48",
  stałe: "#6d28d9",
};

export const CATEGORY_GLYPH: Record<Category, string> = {
  teatr: "🎭",
  muzyka: "🎵",
  sport: "⚽",
  "zwierzęta/natura": "🐾",
  warsztaty: "✂️",
  biblioteka: "📚",
  "campy/ferie": "☀️",
  festyny: "🎈",
  stałe: "📌",
};

export const CATEGORY_FALLBACK: Record<Category, string> = {
  teatr: "images/fallback-stage.jpg",
  muzyka: "images/fallback-music.jpg",
  sport: "images/fallback-athletics.jpg",
  "zwierzęta/natura": "images/fallback-zoo.jpg",
  warsztaty: "images/fallback-crafts.jpg",
  biblioteka: "images/fallback-books.jpg",
  "campy/ferie": "images/fallback-athletics.jpg",
  festyny: "images/fallback-playground.jpg",
  stałe: "images/fallback-playground.jpg",
};
