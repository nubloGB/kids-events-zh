import { Button, Card, Chip, Link } from "@heroui/react";
import { useState } from "react";
import { CalendarMenu } from "./CalendarMenu";
import { splitIso } from "../lib/format";
import { eventKey } from "../lib/events";
import { CATEGORY_FALLBACK } from "../lib/markers";
import type { KidsEvent } from "../types";

const FREE_TEXT = /za darmo|wstęp wolny|darmow|gratis|kostenlos|eintritt frei|bezpłat/i;

function isFree(event: KidsEvent): boolean {
  return FREE_TEXT.test(`${event.description} ${event.registration}`);
}

function titleDomId(event: KidsEvent): string {
  let hash = 0;
  const raw = eventKey(event);
  for (let index = 0; index < raw.length; index += 1) hash = (hash * 33 + raw.charCodeAt(index)) >>> 0;
  return `event-title-${hash.toString(36)}`;
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
  const image = broken ? CATEGORY_FALLBACK[event.category] : event.image;
  const src = `${import.meta.env.BASE_URL}${image}`;
  const titleId = titleDomId(event);
  const free = isFree(event);

  return (
    <Card
      aria-labelledby={titleId}
      className={`event-card group relative hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-secondary${selected ? " is-selected ring-2 ring-secondary" : ""}`}
      render={(props) => <article {...props} />}
      onMouseEnter={() => onHighlight(true)}
      onMouseLeave={() => onHighlight(false)}
    >
      <div className="event-card__media">
        <div className="event-card__frame">
          <img
            alt=""
            className="aspect-video h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
            height={720}
            loading="lazy"
            src={src}
            width={1280}
            onError={() => setBroken(true)}
          />
        </div>
        <div className="event-card__scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <DateBadge event={event} />
        <h3
          className="event-card__title bottom-3 left-4 right-4 text-xl font-bold leading-tight text-white normal-case drop-shadow-md md:text-2xl"
          id={titleId}
        >
          <a
            className="line-clamp-2 after:absolute after:inset-0"
            href={event.url}
            rel="noopener noreferrer"
            target="_blank"
            title={event.title}
          >
            {event.title}
            <span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
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
      <Card.Footer className="event-card__footer relative z-10">
        <CalendarMenu event={event} labeled today={today} />
        <Link className="event-card__external" href={event.url} rel="noopener noreferrer" target="_blank">
          Strona wydarzenia
          <span className="sr-only"> (otwiera się w nowej karcie)</span>
          <Link.Icon />
        </Link>
        <Button className="event-card__map" size="sm" variant="secondary" onPress={onShowOnMap}>
          <PinIcon />
          Pokaż na mapie
        </Button>
      </Card.Footer>
    </Card>
  );
}
