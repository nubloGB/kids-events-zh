export type BoardView = "karty" | "lista" | "mapa";

export const VIEW_STORAGE_KEY = "kids-events-view";

const VIEWS: BoardView[] = ["karty", "lista", "mapa"];

function isView(value: string | null): value is BoardView {
  return value === "karty" || value === "lista" || value === "mapa";
}

/** Saved choice, or Lista when nothing valid has been stored. */
export function readBoardView(storage: Pick<Storage, "getItem"> | null): BoardView {
  try {
    const value = storage?.getItem(VIEW_STORAGE_KEY) ?? null;
    if (isView(value)) return value;
  } catch {
    /* private mode or a blocked storage */
  }
  return "lista";
}

export function writeBoardView(storage: Pick<Storage, "setItem"> | null, view: BoardView): void {
  if (!VIEWS.includes(view)) return;
  try {
    storage?.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}
