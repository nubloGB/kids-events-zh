import { Dropdown } from "@heroui/react";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import type { KidsEvent } from "../types";

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <rect height="15" rx="2" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="5" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function CalendarMenu({
  event,
  today,
  labeled = false,
}: {
  event: KidsEvent;
  today: string;
  labeled?: boolean;
}) {
  return (
    <div
      className="calendar-menu"
      onClick={(click) => click.stopPropagation()}
      onKeyDown={(keyEvent) => keyEvent.stopPropagation()}
    >
      <Dropdown>
        <Dropdown.Trigger
          aria-label={`Dodaj „${event.title}” do kalendarza`}
          className={labeled ? "calendar-button calendar-button--labeled" : "calendar-button"}
        >
          <CalendarIcon />
          {labeled ? <span>Kalendarz</span> : null}
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            aria-label="Dodaj do kalendarza"
            onAction={(key) => {
              if (key === "google") window.open(googleCalendarUrl(event, today), "_blank", "noopener,noreferrer");
              if (key === "ics") downloadIcs(event, today);
            }}
          >
            <Dropdown.Item id="google" textValue="Google Calendar">
              Google Calendar
            </Dropdown.Item>
            <Dropdown.Item id="ics" textValue="Apple / iCal">
              Apple / iCal
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
