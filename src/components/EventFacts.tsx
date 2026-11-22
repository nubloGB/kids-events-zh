import { Chip } from "@heroui/react";
import { isFreeEvent, pricePhrase } from "../lib/eventFacts";
import { recurrenceOf } from "../lib/events";
import type { KidsEvent } from "../types";

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

/** The same facts a card shows, in full: when, age, place, kind, price, and the description. */
export function EventFacts({ event }: { event: KidsEvent }) {
  const free = isFreeEvent(event);
  const price = pricePhrase(event);
  const kind = recurrenceOf(event) === "recurring" ? "Cykliczne" : "Jednodniowe";
  return (
    <div className="list-facts">
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
        <Chip className="chip-kind" size="sm" variant="soft">
          {kind}
        </Chip>
        {price ? (
          <Chip className="chip-price" size="sm" variant="soft">
            {price}
          </Chip>
        ) : null}
        {free ? (
          <Chip className="chip-free" color="success" size="sm" variant="soft">
            Za darmo
          </Chip>
        ) : null}
      </div>
      {event.description.trim() ? <p className="list-facts__desc">{event.description}</p> : null}
    </div>
  );
}
