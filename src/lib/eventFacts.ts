const FREE_TEXT = /za darmo|wstęp wolny|darmow|gratis|kostenlos|eintritt frei|bezpłat/i;
const PRICE_TEXT =
  /(?:ok\.\s*)?\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*CHF(?:\/[^\s,;]+)?/i;

export function isFreeEvent(event: { description: string; registration: string }): boolean {
  return FREE_TEXT.test(`${event.description} ${event.registration}`);
}

/** A short price phrase when the listing names an amount. Null when it does not. */
export function pricePhrase(event: { description: string; registration: string }): string | null {
  const match = `${event.description} ${event.registration}`.match(PRICE_TEXT);
  if (!match) return null;
  return match[0].replace(/\s+/g, " ").trim().replace(/[.)]+$/, "");
}
