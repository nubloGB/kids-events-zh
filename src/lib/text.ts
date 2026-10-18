/** Lowercase and strip Polish diacritics so search ignores ą/ę/ł and friends. */
export function fold(value: string): string {
  return value
    .toLocaleLowerCase("pl")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
