import { LayoutGrid, List, Map } from "lucide-react";
import { useRef } from "react";
import type { BoardView } from "../lib/viewPreference";

const OPTIONS: { id: BoardView; label: string; Icon: typeof List }[] = [
  { id: "karty", label: "Karty", Icon: LayoutGrid },
  { id: "lista", label: "Lista", Icon: List },
  { id: "mapa", label: "Mapa", Icon: Map },
];

export function ViewSwitch({ value, onChange }: { value: BoardView; onChange: (view: BoardView) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(0, OPTIONS.findIndex((option) => option.id === value));

  function move(key: string) {
    if (key === "ArrowRight" || key === "ArrowDown") return Math.min(OPTIONS.length - 1, selected + 1);
    if (key === "ArrowLeft" || key === "ArrowUp") return Math.max(0, selected - 1);
    if (key === "Home") return 0;
    if (key === "End") return OPTIONS.length - 1;
    return null;
  }

  return (
    <div
      aria-label="Widok wydarzeń"
      className="view-switch"
      role="radiogroup"
      onKeyDown={(event) => {
        const next = move(event.key);
        if (next === null || next === selected) return;
        event.preventDefault();
        onChange(OPTIONS[next].id);
        refs.current[next]?.focus();
      }}
    >
      {OPTIONS.map((option, index) => {
        const checked = option.id === value;
        const Icon = option.Icon;
        return (
          <button
            key={option.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            aria-checked={checked}
            className={checked ? "is-active" : undefined}
            role="radio"
            tabIndex={checked ? 0 : -1}
            type="button"
            onClick={() => onChange(option.id)}
          >
            <Icon aria-hidden size={16} strokeWidth={2} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
