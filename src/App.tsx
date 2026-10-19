import { Button, Spinner, Tabs } from "@heroui/react";
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
    <>
      <a className="skip-link" href="#lista">
        Przejdź do treści
      </a>
      <header className="masthead">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:py-12">
          <p className="kicker">Zurych · 2–8 lat</p>
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl leading-tight sm:text-6xl">Wydarzenia dla dzieci</h1>
            <p className="mt-3 text-lg sm:text-xl">
              Teatr, muzyka, sport, warsztaty i zwierzęta w Oerlikonie, Zurychu, Winterthur i okolicach.
            </p>
          </div>
          <p className="text-sm text-muted">
            Ostatnia aktualizacja:{" "}
            {eventsFile ? (
              <time dateTime={eventsFile.updatedAt}>{formatPolishDate(eventsFile.updatedAt)}</time>
            ) : (
              "…"
            )}
            . Minione terminy chowają się same, według daty w Zurychu.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:py-8" id="lista">
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => {
            if (key === "wydarzenia" || key === "zrodla") selectTab(key);
          }}
        >
          <Tabs.ListContainer className="sticky top-0 z-20 -mx-4 bg-background/90 px-4 py-3 backdrop-blur">
            <Tabs.List aria-label="Sekcje">
              <Tabs.Tab id="wydarzenia">
                Wydarzenia
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="zrodla">
                Źródła
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="wydarzenia" className="pt-2">
            {error ? (
              <LoadError message={error} />
            ) : eventsFile ? (
              <EventsBoard events={eventsFile.events} today={today} />
            ) : (
              <Loading />
            )}
          </Tabs.Panel>
          <Tabs.Panel id="zrodla" className="pt-2">
            {error ? (
              <LoadError message={error} />
            ) : sourcesFile ? (
              <SourcesPanel sources={sourcesFile} />
            ) : (
              <Loading />
            )}
          </Tabs.Panel>
        </Tabs>
      </main>
    </>
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
    <div className="rounded-3xl bg-surface px-6 py-10">
      <h2 className="font-display text-2xl">Nie udało się wczytać danych</h2>
      <p className="mt-2">{message}</p>
      <Button className="mt-4" variant="primary" onPress={() => window.location.reload()}>
        Odśwież
      </Button>
    </div>
  );
}
