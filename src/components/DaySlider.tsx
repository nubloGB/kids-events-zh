import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  SLIDER_STOPS,
  dateForSliderStop,
  sliderBubble,
  sliderStopFor,
  sliderStopText,
  type SliderStopId,
} from "../lib/daySlider";
import type { DateFilter } from "../types";

const STOP_COUNT = SLIDER_STOPS.length;

export function DaySlider({
  date,
  today,
  count,
  onDate,
}: {
  date: DateFilter;
  today: string;
  count: number;
  onDate: (date: DateFilter) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gesture = useRef<{ id: number; x: number; y: number; lastY: number; mode: "pending" | "drag" | "scroll"; moved: boolean } | null>(
    null,
  );
  const dragged = useRef(false);
  const [compact, setCompact] = useState(true);
  const selected = sliderStopFor(date);
  const selectedIndex = selected ? SLIDER_STOPS.findIndex((stop) => stop.id === selected) : -1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => setCompact(track.clientWidth < 340);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  function choose(id: SliderStopId) {
    const next = dateForSliderStop(id);
    if (sliderStopFor(date) === id) return;
    onDate(next);
  }

  function indexFromX(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    const span = Math.max(rect.width - 44, 1);
    const ratio = (clientX - rect.left - 22) / span;
    return Math.max(0, Math.min(STOP_COUNT - 1, Math.round(ratio * (STOP_COUNT - 1))));
  }

  function centerOf(index: number): string {
    if (index <= 0) return "22px";
    if (index >= STOP_COUNT - 1) return "calc(100% - 22px)";
    return `calc(22px + (100% - 44px) * ${index / (STOP_COUNT - 1)})`;
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    let next = selectedIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = selectedIndex < 0 ? 0 : Math.min(STOP_COUNT - 1, selectedIndex + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = selectedIndex < 0 ? STOP_COUNT - 1 : Math.max(0, selectedIndex - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = STOP_COUNT - 1;
    else return;
    if (next === selectedIndex && selectedIndex >= 0) return;
    event.preventDefault();
    choose(SLIDER_STOPS[next].id);
    stopRefs.current[next]?.focus();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragged.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastY: event.clientY, mode: "pending", moved: false };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.mode === "pending") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      current.moved = true;
      if (Math.abs(dy) > Math.abs(dx)) current.mode = "scroll";
      else {
        current.mode = "drag";
        dragged.current = true;
        trackRef.current?.setPointerCapture(event.pointerId);
      }
    }
    if (current.mode === "scroll") {
      const shell = document.querySelector<HTMLElement>(".app-shell");
      if (shell) shell.scrollTop -= event.clientY - current.lastY;
      current.lastY = event.clientY;
      return;
    }
    choose(SLIDER_STOPS[indexFromX(event.clientX)].id);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    gesture.current = null;
    if (!current || current.id !== event.pointerId) return;
    if (current.mode === "pending") choose(SLIDER_STOPS[indexFromX(event.clientX)].id);
    if (current.moved) window.setTimeout(() => {
      dragged.current = false;
    }, 0);
  }

  const bubble = sliderBubble(date, today, count);
  const showLabel = (index: number) => !compact || index === 0 || index === STOP_COUNT - 1 || index === selectedIndex;

  return (
    <div className="day-slider">
      <p
        aria-live="polite"
        className={selectedIndex < 0 ? "day-slider__bubble is-center" : "day-slider__bubble"}
        style={
          selectedIndex < 0
            ? undefined
            : {
                left: centerOf(selectedIndex),
                transform:
                  selectedIndex === 0 ? "none" : selectedIndex === STOP_COUNT - 1 ? "translateX(-100%)" : "translateX(-50%)",
              }
        }
      >
        {bubble}
      </p>
      <div
        ref={trackRef}
        aria-label="Zakres dat"
        className="day-slider__track"
        role="radiogroup"
        tabIndex={selectedIndex < 0 ? 0 : -1}
        onKeyDown={onKeyDown}
        onPointerCancel={() => {
          gesture.current = null;
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span aria-hidden="true" className="day-slider__bar" />
        {selectedIndex >= 0 ? (
          <span aria-hidden="true" className="day-slider__thumb" style={{ left: centerOf(selectedIndex) }} />
        ) : null}
        {SLIDER_STOPS.map((stop, index) => {
          const checked = stop.id === selected;
          return (
            <button
              key={stop.id}
              ref={(node) => {
                stopRefs.current[index] = node;
              }}
              aria-checked={checked}
              aria-label={checked ? bubble : sliderStopText(stop.id, today)}
              className="day-slider__stop"
              data-stop={stop.id}
              role="radio"
              style={{ left: `calc(${centerOf(index)} - 22px)` }}
              tabIndex={checked || (selectedIndex < 0 && index === 0) ? 0 : -1}
              type="button"
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                choose(stop.id);
              }}
            >
              <span aria-hidden="true" className="day-slider__mark" />
              {showLabel(index) ? <span className="day-slider__caption">{stop.label}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
