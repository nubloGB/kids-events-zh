import { Card, Chip, Link } from "@heroui/react";
import { useState } from "react";
import { CalendarMenu } from "./CalendarMenu";
import { categoryLabel, splitIso } from "../lib/format";
import { includesToday } from "../lib/events";
import { CATEGORY_FALLBACK } from "../lib/markers";
import type { KidsEvent } from "../types";

function dateBadge(event: KidsEvent): string {
  if (!event.startDate) return "Stałe";
  const start = splitIso(event.startDate);
  if (event.endDate && event.endDate !== event.startDate) {
    const end = splitIso(event.endDate);
    return `${start.day} ${start.month} – ${end.day} ${end.month}`;
  }
  return `${start.day} ${start.month}`;
}

export function EventCard({
  event,
  today,
  selected,
  onSelect,
}: {
  event: KidsEvent;
  today: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const todayHit = includesToday(event, today);
  const image = broken ? CATEGORY_FALLBACK[event.category] : event.image;
  const src = `${import.meta.env.BASE_URL}${image}`;

  return (
    <Card
      className={selected ? "event-tile is-selected" : "event-tile"}
      data-category={event.category}
      aria-pressed={selected}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
          keyEvent.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="event-tile__media">
        <img alt="" height={640} loading="lazy" src={src} width={960} onError={() => setBroken(true)} />
        <div className="event-tile__scrim">
          <div className="event-tile__tools">
            <span className="event-tile__date">{dateBadge(event)}</span>
            <CalendarMenu event={event} labeled today={today} />
          </div>
          <Card.Title className="event-tile__title">
            <Link
              href={event.url}
              rel="noopener noreferrer"
              target="_blank"
              onClick={(click) => click.stopPropagation()}
              onKeyDown={(keyEvent) => keyEvent.stopPropagation()}
            >
              {event.title}
              <Link.Icon />
            </Link>
          </Card.Title>
        </div>
      </div>
      <Card.Content className="event-tile__body">
        <div className="event-tile__chips">
          <Chip size="sm" variant="soft">
            {categoryLabel(event.category)}
          </Chip>
          <Chip size="sm" variant="tertiary">
            {event.area}
          </Chip>
          {event.isNew ? (
            <Chip size="sm" color="warning" variant="soft">
              Nowe
            </Chip>
          ) : null}
          {todayHit ? (
            <Chip size="sm" color="accent" variant="primary">
              Dziś
            </Chip>
          ) : null}
        </div>
        <p className="event-tile__when">{event.dateText}</p>
        <p className="event-tile__where">
          <span>{event.place}</span>
          <span className="event-tile__dot" aria-hidden="true">
            ·
          </span>
          <span>{event.age}</span>
        </p>
        <p className="event-tile__desc">{event.description}</p>
      </Card.Content>
    </Card>
  );
}
