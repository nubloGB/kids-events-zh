import { Card, Chip, buttonVariants } from "@heroui/react";
import { ExternalLink, MapPin } from "lucide-react";
import { useCallback, useEffect, useState, type Ref } from "react";
import { ActionTip } from "./ActionTip";
import { CalendarMenu } from "./CalendarMenu";
import { RouteMenu } from "./RouteMenu";
import { eventCardActions, hasMapLocation } from "../lib/cardActions";
import { canRoute } from "../lib/directions";
import { isFreeEvent } from "../lib/eventFacts";
import { splitIso } from "../lib/format";
import { eventKey } from "../lib/events";
import { CategoryIcons } from "./CategoryIcons";
import { categoryAppearance } from "../lib/markers";
import type { KidsEvent } from "../types";

type ActionLayout = "mobile" | "desktop" | "narrow";

function isFree(event: KidsEvent): boolean {
  return isFreeEvent(event);
}

function titleDomId(event: KidsEvent): string {
  let hash = 0;
  const raw = eventKey(event);
  for (let index = 0; index < raw.length; index += 1) hash = (hash * 33 + raw.charCodeAt(index)) >>> 0;
  return `event-title-${hash.toString(36)}`;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function useActionLayout() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [layout, setLayout] = useState<ActionLayout>(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches ? "desktop" : "mobile",
  );
  const setCard = useCallback((element: HTMLElement | null) => {
    setNode((current) => (current === element ? current : element));
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const read = () => {
      if (!query.matches) {
        setLayout("mobile");
        return;
      }
      const width = node?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY;
      setLayout(width < 300 ? "narrow" : "desktop");
    };
    read();
    const observer = node ? new ResizeObserver(read) : null;
    if (node) observer?.observe(node);
    query.addEventListener("change", read);
    return () => {
      observer?.disconnect();
      query.removeEventListener("change", read);
    };
  }, [node]);

  return { layout, setCard };
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function AgeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 19c.6-3 2.7-4.5 6-4.5S17.4 16 18 19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="1.6" fill="currentColor" />
    </svg>
  );
}

function CardImage({ image, onError }: { image: string; onError: () => void }) {
  const base = import.meta.env.BASE_URL;
  const stem = image.replace(/\.jpg$/, "");
  return (
    <picture>
      <source
        sizes="(max-width: 639px) 100vw, 360px"
        srcSet={`${base}${stem}-640.webp 640w, ${base}${stem}-1280.webp 1280w`}
        type="image/webp"
      />
      <img
        alt=""
        className="aspect-video h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
        height={720}
        loading="lazy"
        src={`${base}${image}`}
        width={1280}
        onError={onError}
      />
    </picture>
  );
}

function DateBadge({ event }: { event: KidsEvent }) {
  if (!event.startDate) {
    return <span className="event-card__badge event-card__badge--recurring">Stałe</span>;
  }
  const { day, month } = splitIso(event.startDate);
  return (
    <time className="event-card__badge" dateTime={event.startDate}>
      <span className="event-card__day">{day}</span>
      <span className="event-card__month">{month.toLocaleUpperCase("pl")}</span>
    </time>
  );
}

export function EventCard({
  event,
  today,
  selected,
  onHighlight,
  onShowOnMap,
}: {
  event: KidsEvent;
  today: string;
  selected: boolean;
  onHighlight: (active: boolean) => void;
  onShowOnMap: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const { layout, setCard } = useActionLayout();
  const image = broken ? categoryAppearance(event.category).image : event.image;
  const titleId = titleDomId(event);
  const free = isFree(event);
  const actions = eventCardActions(event);
  const hasPage = actions.primary === "page";
  const pageUrl = event.url.trim();

  return (
    <Card
      aria-labelledby={titleId}
      className={`event-card group relative hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-secondary${selected ? " is-selected ring-2 ring-secondary" : ""}`}
      render={(props) => (
        <article
          {...props}
          ref={(element) => {
            setCard(element);
            assignRef(props.ref as Ref<HTMLElement> | undefined, element);
          }}
        />
      )}
      onMouseEnter={() => onHighlight(true)}
      onMouseLeave={() => onHighlight(false)}
    >
      <div className="event-card__media">
        {hasPage ? (
          <a
            aria-label={`${event.title} (otwiera się w nowej karcie)`}
            className="event-card__frame"
            href={pageUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <CardImage image={image} onError={() => setBroken(true)} />
          </a>
        ) : (
          <div className="event-card__frame">
            <CardImage image={image} onError={() => setBroken(true)} />
          </div>
        )}
        <div className="event-card__scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <DateBadge event={event} />
        <h3
          className="event-card__title bottom-3 left-4 right-4 text-xl font-bold leading-tight text-white normal-case drop-shadow-md md:text-2xl"
          id={titleId}
        >
          {hasPage ? (
            <a
              className="line-clamp-2"
              href={pageUrl}
              rel="noopener noreferrer"
              target="_blank"
              title={event.title}
            >
              <CategoryIcons event={event} />
              {event.title}
              <span className="sr-only"> (otwiera się w nowej karcie)</span>
            </a>
          ) : (
            <span className="line-clamp-2" title={event.title}>
              <CategoryIcons event={event} />
              {event.title}
            </span>
          )}
        </h3>
      </div>
      <Card.Content className="event-card__body">
        <div className="event-card__chips">
          <Chip className="chip-when" size="sm" variant="soft">
            <ClockIcon />
            {event.startDate ? <time dateTime={event.startDate}>{event.dateText}</time> : event.dateText}
          </Chip>
          <Chip className="chip-age" size="sm" variant="soft">
            <AgeIcon />
            {event.age}
          </Chip>
          <Chip className="chip-place" size="sm" variant="soft">
            <PinIcon />
            {event.place}
          </Chip>
          {free ? (
            <Chip className="chip-free" color="success" size="sm" variant="soft">
              Za darmo
            </Chip>
          ) : null}
        </div>
        <p className="event-card__desc text-small line-clamp-2 text-default-500">{event.description}</p>
      </Card.Content>
      <Card.Footer className="event-card__footer event-actions">
        {hasPage ? (
          <ActionTip label={layout === "narrow" ? "Do wydarzenia" : null}>
            <a
              aria-label="Do wydarzenia (otwiera się w nowej karcie)"
              className={`${buttonVariants({ variant: "primary" })} event-action event-action--primary`}
              href={pageUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="event-action__text">Do wydarzenia</span>
              <ExternalLink aria-hidden className="event-action__icon event-action__icon--end" size={16} strokeWidth={2} />
            </a>
          </ActionTip>
        ) : (
          <CalendarMenu
            event={event}
            today={today}
            tooltip={layout === "narrow" ? "Dodaj do kalendarza" : null}
            variant="primary"
          />
        )}
        {hasPage ? (
          <CalendarMenu
            event={event}
            today={today}
            tooltip={layout === "desktop" ? null : "Dodaj do kalendarza"}
            variant="secondary"
          />
        ) : null}
        {canRoute(event) ? <RouteMenu event={event} tooltip={layout === "desktop" ? null : "Trasa"} /> : null}
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
      </Card.Footer>
    </Card>
  );
}
