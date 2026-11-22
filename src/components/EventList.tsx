import { buttonVariants } from "@heroui/react";
import { ChevronUp, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { CalendarMenu } from "./CalendarMenu";
import { CategoryIcons } from "./CategoryIcons";
import { EventFacts } from "./EventFacts";
import { RouteMenu } from "./RouteMenu";
import { eventCardActions, hasMapLocation } from "../lib/cardActions";
import { canRoute } from "../lib/directions";
import { eventKey } from "../lib/events";
import { dayHeaderLabel, dayTile, formatClock, groupByDay } from "../lib/listDays";
import type { KidsEvent } from "../types";

export function EventList({
  events,
  today,
  phone,
  selectedId,
  expandId,
  expandTick,
  itemRefs,
  onHighlight,
  onShowOnMap,
}: {
  events: KidsEvent[];
  today: string;
  phone: boolean;
  selectedId: string | null;
  expandId: string | null;
  expandTick: number;
  itemRefs: MutableRefObject<Map<string, HTMLElement>>;
  onHighlight: (id: string | null) => void;
  onShowOnMap: (id: string) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(expandId);
  const { days, undated } = groupByDay(events);

  useEffect(() => {
    if (expandId) setOpenKey(expandId);
  }, [expandId, expandTick]);

  function toggle(key: string) {
    setOpenKey((current) => (current === key ? null : key));
  }

  if (phone) {
    return (
      <div className="dense-list">
        <FloatingDay watch={days.map((day) => day.iso).join()} />
        {days.map((day) => (
          <section key={day.iso} className="day-group">
            <DayHeading count={day.events.length} iso={day.iso} today={today} />
            <ul>
              {day.events.map((event) => (
                <MobileRow
                  key={eventKey(event)}
                  event={event}
                  itemRefs={itemRefs}
                  open={openKey === eventKey(event)}
                  selected={eventKey(event) === selectedId}
                  today={today}
                  onHighlight={onHighlight}
                  onShowOnMap={() => onShowOnMap(eventKey(event))}
                  onToggle={() => toggle(eventKey(event))}
                />
              ))}
            </ul>
          </section>
        ))}
        {undated.length > 0 ? (
          <section className="day-group">
            <h3 className="day-heading day-heading--plain">Stałe zajęcia</h3>
            <ul>
              {undated.map((event) => (
                <MobileRow
                  key={eventKey(event)}
                  event={event}
                  itemRefs={itemRefs}
                  open={openKey === eventKey(event)}
                  selected={eventKey(event) === selectedId}
                  today={today}
                  onHighlight={onHighlight}
                  onShowOnMap={() => onShowOnMap(eventKey(event))}
                  onToggle={() => toggle(eventKey(event))}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <table className="list-table">
      <thead>
        <tr>
          <th scope="col">Godzina</th>
          <th scope="col">Wydarzenie</th>
          <th scope="col">Wiek</th>
          <th scope="col">Miejsce</th>
          <th scope="col">
            <span className="sr-only">Akcje</span>
          </th>
        </tr>
      </thead>
      {days.map((day) => (
        <tbody key={day.iso}>
          <tr className="day-header-row">
            <th colSpan={5} scope="rowgroup">
              <DayHeading count={day.events.length} iso={day.iso} today={today} />
            </th>
          </tr>
          {day.events.map((event) => (
            <DesktopRows
              key={eventKey(event)}
              event={event}
              itemRefs={itemRefs}
              open={openKey === eventKey(event)}
              selected={eventKey(event) === selectedId}
              today={today}
              onHighlight={onHighlight}
              onShowOnMap={() => onShowOnMap(eventKey(event))}
              onToggle={() => toggle(eventKey(event))}
            />
          ))}
        </tbody>
      ))}
      {undated.length > 0 ? (
        <tbody>
          <tr className="day-header-row">
            <th colSpan={5} scope="rowgroup">
              Stałe zajęcia
            </th>
          </tr>
          {undated.map((event) => (
            <DesktopRows
              key={eventKey(event)}
              event={event}
              itemRefs={itemRefs}
              open={openKey === eventKey(event)}
              selected={eventKey(event) === selectedId}
              today={today}
              onHighlight={onHighlight}
              onShowOnMap={() => onShowOnMap(eventKey(event))}
              onToggle={() => toggle(eventKey(event))}
            />
          ))}
        </tbody>
      ) : null}
    </table>
  );
}

function FloatingDay({ watch }: { watch: string }) {
  const [text, setText] = useState<string | null>(null);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".app-shell");
    const bar = document.querySelector<HTMLElement>(".phone-sticky");
    if (!root) return;
    const update = () => {
      const height = bar?.getBoundingClientRect().height ?? 0;
      setTop(height);
      const headings = [...root.querySelectorAll<HTMLElement>(".day-heading")];
      const current = [...headings].reverse().find((node) => node.getBoundingClientRect().top <= height + 1);
      setText(current ? current.querySelector("p")?.textContent ?? null : null);
    };
    const observer = new IntersectionObserver(update, { root, threshold: [0, 1] });
    root.querySelectorAll(".day-heading").forEach((node) => observer.observe(node));
    if (bar) observer.observe(bar);
    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", update);
    };
  }, [watch]);

  if (!text) return null;
  return (
    <div className="day-float" style={{ top }}>
      {text}
    </div>
  );
}

function DayHeading({ iso, today, count }: { iso: string; today: string; count: number }) {
  const tile = dayTile(iso);
  return (
    <div className="day-heading">
      <span className="day-tile">
        <span className="day-tile__month">{tile.month}</span>
        <span className="day-tile__num">{tile.day}</span>
      </span>
      <p>{dayHeaderLabel(iso, today, count)}</p>
    </div>
  );
}

function RowActions({
  event,
  today,
  onShowOnMap,
}: {
  event: KidsEvent;
  today: string;
  onShowOnMap: () => void;
}) {
  const actions = eventCardActions(event);
  const page = event.url.trim();
  const hasPage = actions.primary === "page";
  return (
    <div className="event-actions list-row__actions" onClick={(eventClick) => eventClick.stopPropagation()}>
      {hasPage ? (
        <a
          aria-label="Do wydarzenia (otwiera się w nowej karcie)"
          className={`${buttonVariants({ variant: "primary" })} event-action event-action--primary`}
          href={page}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="event-action__text">Do wydarzenia</span>
          <ExternalLink aria-hidden className="event-action__icon" size={16} strokeWidth={2} />
        </a>
      ) : (
        <CalendarMenu event={event} today={today} variant="primary" />
      )}
      {hasPage ? <CalendarMenu event={event} today={today} variant="secondary" /> : null}
      {canRoute(event) ? <RouteMenu event={event} tooltip={null} /> : null}
      {hasMapLocation(event) ? (
        <button
          aria-label="Pokaż na mapie"
          className={`${buttonVariants({ isIconOnly: true, variant: "secondary" })} event-action event-action--secondary`}
          title="Pokaż na mapie"
          type="button"
          onClick={onShowOnMap}
        >
          <MapPin aria-hidden className="event-action__icon" size={20} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

function MobileRow({
  event,
  today,
  open,
  selected,
  itemRefs,
  onToggle,
  onHighlight,
  onShowOnMap,
}: {
  event: KidsEvent;
  today: string;
  open: boolean;
  selected: boolean;
  itemRefs: MutableRefObject<Map<string, HTMLElement>>;
  onToggle: () => void;
  onHighlight: (id: string | null) => void;
  onShowOnMap: () => void;
}) {
  const key = eventKey(event);
  const rowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = rowRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      const shell = document.querySelector(".app-shell");
      const limit = (shell?.getBoundingClientRect().bottom ?? window.innerHeight) - 12;
      if (rect.bottom > limit) {
        node.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      }
    }, reduced ? 0 : 240);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <li
      ref={(node) => {
        rowRef.current = node;
        if (node) itemRefs.current.set(key, node);
        else itemRefs.current.delete(key);
      }}
      className={open ? "list-item is-open" : selected ? "list-item is-selected" : "list-item"}
      onMouseEnter={() => onHighlight(key)}
      onMouseLeave={() => onHighlight(null)}
    >
      <button aria-expanded={open} className="list-row" type="button" onClick={onToggle}>
        <time className="list-row__time" dateTime={event.startDate ?? undefined}>
          {formatClock(event.dateText)}
        </time>
        <CategoryIcons event={event} />
        <span className="list-row__title">{event.title}</span>
        <span className="list-row__age">{event.age}</span>
        <span aria-hidden="true" className="list-row__more">
          <span className="list-row__dots">⋯</span>
          <ChevronUp className="list-row__chevron" size={18} strokeWidth={2.4} />
        </span>
      </button>
      <div className="list-item__reveal">
        <div className="list-item__clip">
          <div className="list-row__panel">
            <EventFacts event={event} />
            <RowActions event={event} today={today} onShowOnMap={onShowOnMap} />
          </div>
        </div>
      </div>
    </li>
  );
}

function DesktopRows({
  event,
  today,
  open,
  selected,
  itemRefs,
  onToggle,
  onHighlight,
  onShowOnMap,
}: {
  event: KidsEvent;
  today: string;
  open: boolean;
  selected: boolean;
  itemRefs: MutableRefObject<Map<string, HTMLElement>>;
  onToggle: () => void;
  onHighlight: (id: string | null) => void;
  onShowOnMap: () => void;
}) {
  const key = eventKey(event);
  const [menu, setMenu] = useState(false);
  return (
    <>
      <tr
        ref={(node) => {
          if (node) itemRefs.current.set(key, node);
          else itemRefs.current.delete(key);
        }}
        className={open ? "is-open" : selected ? "is-selected" : undefined}
        onClick={(click) => {
          if ((click.target as HTMLElement).closest(".event-actions, a, button")) return;
          onToggle();
        }}
        onMouseEnter={() => onHighlight(key)}
        onMouseLeave={() => onHighlight(null)}
      >
        <td className="list-table__time">{formatClock(event.dateText)}</td>
        <td className="list-table__event">
          <button aria-expanded={open} className="list-table__title" type="button" onClick={onToggle}>
            <CategoryIcons event={event} />
            <span className="list-table__name">{event.title}</span>
          </button>
          <span className="list-table__place-inline">{event.place}</span>
        </td>
        <td className="list-table__age">{event.age}</td>
        <td className="list-table__place">{event.place}</td>
        <td className={menu ? "list-table__actions is-open" : "list-table__actions"}>
          <button
            aria-expanded={menu}
            aria-label="Akcje"
            className="list-table__more"
            type="button"
            onClick={() => setMenu((openMenu) => !openMenu)}
          >
            ⋯
          </button>
          <RowActions event={event} today={today} onShowOnMap={onShowOnMap} />
        </td>
      </tr>
      <tr className={open ? "list-table__details is-open" : "list-table__details"}>
        <td colSpan={5}>
          <div className="list-item__reveal">
            <div className="list-item__clip">
              <EventFacts event={event} />
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
