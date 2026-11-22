import { formatPolishShortDate } from "../lib/format";

export function UpdatedNote({ iso }: { iso: string | null }) {
  if (!iso) return null;
  return (
    <p className="updated-note">
      Aktualizacja: <time dateTime={iso}>{formatPolishShortDate(iso)}</time>
      {" · minione terminy znikają automatycznie"}
    </p>
  );
}
