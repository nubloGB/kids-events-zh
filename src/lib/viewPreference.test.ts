import { readBoardView, writeBoardView, VIEW_STORAGE_KEY } from "./viewPreference";
import { describe, expect, it } from "vitest";

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("board view preference", () => {
  it("falls back to Lista and keeps an explicit choice", () => {
    const store = memory();
    expect(readBoardView(store)).toBe("lista");
    expect(readBoardView(null)).toBe("lista");
    store.setItem(VIEW_STORAGE_KEY, "nope");
    expect(readBoardView(store)).toBe("lista");
    writeBoardView(store, "karty");
    expect(readBoardView(store)).toBe("karty");
    writeBoardView(store, "mapa");
    expect(readBoardView(store)).toBe("mapa");
    writeBoardView(store, "lista");
    expect(readBoardView(store)).toBe("lista");
  });
});
