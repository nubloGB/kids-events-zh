import { Chip, Link, Table } from "@heroui/react";
import { categoryLabel } from "../lib/format";
import { eventKey, includesToday } from "../lib/events";
import type { KidsEvent } from "../types";

export function EventTable({ events, today, label }: { events: KidsEvent[]; today: string; label: string }) {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label={label} className="min-w-[760px]">
          <Table.Header>
            <Table.Column isRowHeader>Wydarzenie</Table.Column>
            <Table.Column>Data</Table.Column>
            <Table.Column>Wiek</Table.Column>
            <Table.Column>Miejsce</Table.Column>
            <Table.Column>Zapisy</Table.Column>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <Table.Row key={eventKey(event)} id={eventKey(event)}>
                <Table.Cell>
                  <div className="flex flex-col gap-1">
                    <Link href={event.url} target="_blank" rel="noopener noreferrer">
                      {event.title}
                    </Link>
                    <div className="flex flex-wrap gap-1">
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
                      {includesToday(event, today) ? (
                        <Chip size="sm" color="accent" variant="primary">
                          Dziś
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{event.dateText}</Table.Cell>
                <Table.Cell>{event.age}</Table.Cell>
                <Table.Cell>{event.place}</Table.Cell>
                <Table.Cell>{event.registration}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
