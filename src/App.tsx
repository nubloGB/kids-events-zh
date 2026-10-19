import { Button, SearchField, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { EventsBoard } from "./components/EventsBoard";
import { SourcesPanel } from "./components/SourcesPanel";
import { formatPolishDate } from "./lib/format";
import { parseEventsFile, zurichToday } from "./lib/events";
import { parseSourcesFile } from "./lib/sources";
import type { EventsFile, SourcesFile } from "./types";

type TabId = "wydarzenia" | "zrodla";

function initialTab(): TabId {
  return window.location.hash === "#zrodla" ? "zrodla" : "wydarzenia";
}

export default function App() {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [eventsFile, setEventsFile] = useState<EventsFile | null>(null);
  const [sourcesFile, setSourcesFile] = useState<SourcesFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [today] = useState(() => zurichToday());

  useEffect(() => {
    const onHash = () => setTab(initialTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    let cancelled = false;
    Promise.all([fetch(`${base}events.json`), fetch(`${base}sources.json`)])
      .then(async ([eventsResponse, sourcesResponse]) => {
        if (!eventsResponse.ok || !sourcesResponse.ok) {
          throw new Error("Nie udało się pobrać plików z danymi.");
        }
        const eventsJson: unknown = await eventsResponse.json();
        const sourcesJson: unknown = await sourcesResponse.json();
        const events = parseEventsFile(eventsJson);
        const sources = parseSourcesFile(sourcesJson);
        if (!cancelled) {
          setEventsFile(events);
          setSourcesFile(sources);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Nie udało się wczytać danych.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTab(next: TabId) {
    setTab(next);
    const hash = next === "zrodla" ? "#zrodla" : "#wydarzenia";
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#lista">
        Przejdź do treści
      </a>
      <header className="hero">
        <div className="hero-bar">
          <a className="brand" href="#wydarzenia" onClick={() => selectTab("wydarzenia")}>
            <span aria-hidden="true" className="brand-mark">
              ✦
            </span>
            Dzieci w Zurychu
          </a>
          <nav aria-label="Sekcje" className="hero-tabs">
            <button
              className={tab === "wydarzenia" ? "nav-pill is-active" : "nav-pill"}
              type="button"
              onClick={() => selectTab("wydarzenia")}
            >
              Wydarzenia
            </button>
            <button
              className={tab === "zrodla" ? "nav-pill is-active" : "nav-pill"}
              type="button"
              onClick={() => selectTab("zrodla")}
            >
              Źródła
            </button>
          </nav>
        </div>

        <div className="hero-copy">
          <h1>Znajdź wydarzenia dla dzieci</h1>
          <p>Teatr, muzyka, sport, warsztaty i zwierzęta. Oerlikon, Zurych, Winterthur i okolice. Wiek 2–8 lat.</p>
        </div>

        {tab === "wydarzenia" ? (
          <form className="hero-search" onSubmit={(event) => event.preventDefault()}>
            <SearchField
              aria-label="Szukaj wydarzeń"
              className="hero-search-field"
              value={query}
              variant="secondary"
              onChange={setQuery}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Tytuł, miejsce, opis…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <button className="search-go" type="submit">
              Szukaj
            </button>
          </form>
        ) : null}

        <p className="hero-updated">
          Ostatnia aktualizacja:{" "}
          {eventsFile ? (
            <time dateTime={eventsFile.updatedAt}>{formatPolishDate(eventsFile.updatedAt)}</time>
          ) : (
            "…"
          )}
          . Minione terminy chowają się same.
        </p>
      </header>

      <div className="app-body">
        {error ? (
          <div className="panel-scroll">
            <LoadError message={error} />
          </div>
        ) : tab === "zrodla" ? (
          <div className="sources-scroll">
            {sourcesFile ? <SourcesPanel sources={sourcesFile} /> : <Loading />}
          </div>
        ) : eventsFile ? (
          <EventsBoard events={eventsFile.events} query={query} today={today} onQueryChange={setQuery} />
        ) : (
          <div className="panel-scroll">
            <Loading />
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <p className="flex items-center gap-3 py-10 text-muted">
      <Spinner aria-label="Wczytywanie" />
      Wczytywanie…
    </p>
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="soft-card px-6 py-10">
      <h2 className="font-display text-2xl">Nie udało się wczytać danych</h2>
      <p className="mt-2">{message}</p>
      <Button className="btn-gradient mt-4" variant="primary" onPress={() => window.location.reload()}>
        Odśwież
      </Button>
    </div>
  );
}
