import { Dropdown, buttonVariants, toast } from "@heroui/react";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { ActionTip } from "./ActionTip";
import { calendarTargetOrder, isIosDevice, type CalendarTarget } from "../lib/cardActions";
import { downloadIcs, googleCalendarUrl, outlookCalendarUrl } from "../lib/calendar";
import type { KidsEvent } from "../types";

const TARGET_LABEL: Record<CalendarTarget, string> = {
  ics: "Apple / iCal (.ics)",
  google: "Google Calendar",
  outlook: "Outlook",
};

function devicePrefersIcsFirst(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIosDevice(navigator.userAgent, {
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

export function CalendarMenu({
  event,
  today,
  variant = "popup",
  tooltip = null,
}: {
  event: KidsEvent;
  today: string;
  /** Card primary is the solid text button. Card secondary is the flat control. Popup stays the map pin menu. */
  variant?: "primary" | "secondary" | "popup";
  tooltip?: string | null;
}) {
  const [targets] = useState(() => calendarTargetOrder(devicePrefersIcsFirst()));
  const [menuOpen, setMenuOpen] = useState(false);
  const onCard = variant !== "popup";

  function addToCalendar(key: string | number) {
    if (key === "google") window.open(googleCalendarUrl(event, today), "_blank", "noopener,noreferrer");
    else if (key === "outlook") window.open(outlookCalendarUrl(event, today), "_blank", "noopener,noreferrer");
    else if (key === "ics") downloadIcs(event, today);
    else return;
    toast.success("Dodano do kalendarza");
  }

  const trigger = onCard ? (
    <Dropdown.Trigger
      aria-label="Dodaj do kalendarza"
      className={`${buttonVariants({
        isIconOnly: variant === "secondary",
        variant: variant === "primary" ? "primary" : "secondary",
      })} event-action event-action--${variant}`}
    >
      <CalendarPlus aria-hidden className="event-action__icon" size={20} strokeWidth={2} />
      <span className={variant === "secondary" ? "event-action__text event-action__text--short" : "event-action__text"}>
        {variant === "secondary" ? "Kalendarz" : "Dodaj do kalendarza"}
      </span>
    </Dropdown.Trigger>
  ) : (
    <Dropdown.Trigger aria-label={`Dodaj ${event.title} do kalendarza`} className="calendar-button">
      <CalendarPlus aria-hidden size={18} strokeWidth={2} />
    </Dropdown.Trigger>
  );

  return (
    <div
      className={onCard ? `calendar-menu calendar-menu--${variant}` : "calendar-menu"}
      onClick={(click) => click.stopPropagation()}
      onKeyDown={(keyEvent) => keyEvent.stopPropagation()}
    >
      <Dropdown isOpen={menuOpen} onOpenChange={setMenuOpen}>
        <ActionTip disabled={menuOpen} label={tooltip}>
          {trigger}
        </ActionTip>
        <Dropdown.Popover className="calendar-menu__popover" containerPadding={12} placement="bottom end" shouldFlip={false}>
          <Dropdown.Menu aria-label="Dodaj do kalendarza" onAction={(key) => addToCalendar(key)}>
            {targets.map((target) => (
              <Dropdown.Item key={target} id={target} textValue={TARGET_LABEL[target]}>
                {TARGET_LABEL[target]}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
