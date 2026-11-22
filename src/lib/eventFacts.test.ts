import { describe, expect, it } from "vitest";
import { isFreeEvent, pricePhrase } from "./eventFacts";

const blank = { description: "", registration: "" };

describe("isFreeEvent", () => {
  it("recognises a free listing in the description or the registration note", () => {
    expect(isFreeEvent({ description: "Teatr muzyczny, za darmo.", registration: "" })).toBe(true);
    expect(isFreeEvent({ description: "Hala", registration: "Bez zapisów, gratis" })).toBe(true);
    expect(isFreeEvent({ description: "Wstęp wolny, bez zapisów.", registration: "" })).toBe(true);
    expect(isFreeEvent(blank)).toBe(false);
  });
});

describe("pricePhrase", () => {
  it("returns the first amount and leaves a free-only listing without a price", () => {
    expect(pricePhrase({ description: "5 CHF od osoby, poniżej 4 lat gratis.", registration: "" })).toBe("5 CHF");
    expect(pricePhrase({ description: "ok. 5 CHF/świeca.", registration: "" })).toBe("ok. 5 CHF/świeca");
    expect(pricePhrase({ description: "120–160 CHF/h.", registration: "" })).toBe("120–160 CHF/h");
    expect(pricePhrase({ description: "Teatr muzyczny, za darmo.", registration: "" })).toBe(null);
    expect(pricePhrase(blank)).toBe(null);
  });
});
