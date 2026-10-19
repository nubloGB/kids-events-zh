import { Card, Chip, Link } from "@heroui/react";
import { categoryLabel, splitIso } from "../lib/format";
import { includesToday } from "../lib/events";
import type { KidsEvent } from "../types";

function DateStamp({ event }: { event: KidsEvent }) {
  if (!event.startDate) {
    return (
      <div className="date-stamp date-stamp--recurring" aria-hidden="true">
        Stałe
      </div>
    );
  }
  const start = splitIso(event.startDate);
  const end = event.endDate && event.endDate !== event.startDate ? splitIso(event.endDate) : null;
  return (
    <div className="date-stamp" aria-hidden="true">
      <span className="date-stamp__day">{start.day}</span>
      <span className="date-stamp__month">{start.month}</span>
      {end ? (
        <span className="date-stamp__end">
          – {end.day} {end.month}
        </span>
      ) : null}
    </div>
  );
}

export function EventCard({ event, today }: { event: KidsEvent; today: string }) {
  const todayHit = includesToday(event, today);
  return (
    <Card className="event-card h-full" data-category={event.category} data-today={todayHit ? "true" : undefined}>
      <Card.Header className="items-start gap-3">
        <DateStamp event={event} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
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
          <Card.Title className="text-xl leading-snug">
            <Link href={event.url} target="_blank" rel="noopener noreferrer">
              {event.title}
              <Link.Icon />
            </Link>
          </Card.Title>
          <p className="mt-1 text-sm text-muted">{event.dateText}</p>
        </div>
      </Card.Header>
      <Card.Content>
        <p>{event.description}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Wiek</dt>
            <dd>{event.age}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Miejsce</dt>
            <dd>{event.place}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Zapisy</dt>
            <dd>{event.registration}</dd>
          </div>
        </dl>
      </Card.Content>
    </Card>
  );
}
