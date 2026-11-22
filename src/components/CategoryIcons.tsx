import { eventCategoryMarks } from "../lib/markers";

/** Small category emoji between the time and the name. */
export function CategoryIcons({ event }: { event: { category: string; tags: string[] } }) {
  const marks = eventCategoryMarks(event);
  const label = marks.map((mark) => mark.label).join(", ");
  return (
    <span className="category-icons" role="img" title={label} aria-label={label}>
      {marks.map((mark) => (
        <span key={mark.id} aria-hidden="true" className="category-icons__glyph">
          {mark.icon}
        </span>
      ))}
    </span>
  );
}
