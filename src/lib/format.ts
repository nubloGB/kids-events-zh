const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

export function splitIso(iso: string): { day: number; month: string } {
  const [, month, day] = iso.split("-").map(Number);
  return { day, month: MONTHS[(month ?? 1) - 1] ?? "" };
}

export function formatPolishDate(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Zurich",
  }).format(new Date(`${iso}T12:00:00+01:00`));
}

export function countLabel(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return `1 ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}

export function categoryLabel(category: string): string {
  if (category.length === 0) return category;
  return category.charAt(0).toLocaleUpperCase("pl") + category.slice(1);
}
