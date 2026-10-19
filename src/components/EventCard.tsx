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
      className={selected ? "event-card is-selected" : "event-card"}
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
      <div className="event-card__media">
        <img
          alt=""
          height={640}
          loading="lazy"
          src={src}
          width={960}
          onError={() => setBroken(true)}
        />
        <span className="event-card__date">{dateBadge(event)}</span>
      </div>
      <Card.Content className="event-card__body">
        <div className="event-card__topline">
          <div className="flex flex-wrap gap-1.5">
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
          <CalendarMenu event={event} today={today} />
        </div>
        <Card.Title className="text-lg leading-snug">
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
        <p className="mt-1 text-sm text-muted">{event.dateText}</p>
        <p className="event-card__desc">{event.description}</p>
        <p className="mt-2 text-sm">
          <span className="text-muted">Wiek </span>
          {event.age}
          <span className="text-muted"> · </span>
          {event.place}
        </p>
      </Card.Content>
    </Card>
  );
}
