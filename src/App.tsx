import { Button, SearchField, ToastProvider } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { EventsBoard } from "./components/EventsBoard";
import { SourcesPanel } from "./components/SourcesPanel";
import { UpdatedNote } from "./components/UpdatedNote";
import { DateFilterProvider } from "./lib/dateFilterContext";
import { formatPolishDate } from "./lib/format";
import { parseEventsFile } from "./lib/events";
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
  const [sectionsMenu, setSectionsMenu] = useState(false);
  const [sectionsCramped, setSectionsCramped] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHash = () => setTab(initialTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title =
      tab === "zrodla" ? "Źródła — Wydarzenia dla dzieci w Zurychu" : "Wydarzenia dla dzieci w Zurychu";
    document.querySelector(".app-shell")?.scrollTo({ top: 0 });
    setSectionsMenu(false);
  }, [tab]);

  useEffect(() => {
    const bar = barRef.current;
    const tabs = tabsRef.current;
    if (!bar || !tabs) return;
    const check = () => {
      if (window.innerWidth >= 640) {
        setSectionsCramped(false);
        return;
      }
      const styles = getComputedStyle(bar);
      const pad = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 8;
      const available = bar.clientWidth - pad - 28 - gap;
      setSectionsCramped(tabs.scrollWidth > available);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(bar);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (!sectionsMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSectionsMenu(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !barRef.current?.querySelector(".section-menu")?.contains(target)) {
        setSectionsMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [sectionsMenu]);

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
    if (window.location.hash === hash) return;
    const url = new URL(window.location.href);
    url.hash = hash;
    history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <DateFilterProvider>
    <div className="app-shell">
      <ToastProvider aria-label="Powiadomienia" placement="top" />
      <header className="hero" data-mobile-header="brand">
        <div className="hero-bar" ref={barRef}>
          <a className="brand" href="#wydarzenia" onClick={() => selectTab("wydarzenia")}>
            <span aria-hidden="true" className="brand-mark">
              ✦
            </span>
            <span className="brand-name">Dzieci w Zurychu</span>
          </a>
          <nav
            aria-hidden={sectionsCramped ? true : undefined}
            aria-label="Sekcje"
            className={sectionsCramped ? "hero-tabs hero-tabs--measure" : "hero-tabs"}
            ref={tabsRef}
          >
            <button
              className={tab === "wydarzenia" ? "nav-pill is-active" : "nav-pill"}
              tabIndex={sectionsCramped ? -1 : undefined}
              type="button"
              onClick={() => selectTab("wydarzenia")}
            >
              Wydarzenia
            </button>
            <button
              className={tab === "zrodla" ? "nav-pill is-active" : "nav-pill"}
              tabIndex={sectionsCramped ? -1 : undefined}
              type="button"
              onClick={() => selectTab("zrodla")}
            >
              Źródła
            </button>
          </nav>
          {sectionsCramped ? (
            <div className="section-menu">
              <button
                aria-controls="section-menu-panel"
                aria-expanded={sectionsMenu}
                aria-label="Sekcje"
                className="section-menu-button"
                type="button"
                onClick={() => setSectionsMenu((open) => !open)}
              >
                <MenuIcon />
              </button>
              {sectionsMenu ? (
                <div className="section-menu-panel" id="section-menu-panel" role="menu">
                  <button
                    className={tab === "wydarzenia" ? "is-active" : undefined}
                    role="menuitem"
                    type="button"
                    onClick={() => selectTab("wydarzenia")}
                  >
                    Wydarzenia
                  </button>
                  <button
                    className={tab === "zrodla" ? "is-active" : undefined}
                    role="menuitem"
                    type="button"
                    onClick={() => selectTab("zrodla")}
                  >
                    Źródła
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="hero-copy">
          <h1>{tab === "zrodla" ? "Źródła wydarzeń dla dzieci" : "Znajdź wydarzenia dla dzieci"}</h1>
          <p>
            {tab === "zrodla"
              ? "Organizatorzy i strony, z których biorą się terminy."
              : "Teatr, muzyka, sport i warsztaty. Oerlikon, Zurych, Winterthur i okolice."}{" "}
            Ostatnia aktualizacja:{" "}
            {eventsFile ? (
              <time dateTime={eventsFile.updatedAt}>{formatPolishDate(eventsFile.updatedAt)}</time>
            ) : (
              "…"
            )}
            .
          </p>
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
                <SearchField.ClearButton aria-label="Wyczyść wyszukiwanie" />
              </SearchField.Group>
            </SearchField>
            <button className="search-go" type="submit">
              Szukaj
            </button>
          </form>
        ) : null}
      </header>

      <main className="app-body">
        <a className="skip-link" href={tab === "zrodla" ? "#zrodla-tresc" : "#lista"}>
          Przejdź do treści
        </a>
        {error ? (
          <div className="panel-scroll">
            <LoadError message={error} />
          </div>
        ) : tab === "zrodla" ? (
          <div className="sources-scroll" id="zrodla-tresc" tabIndex={-1}>
            <UpdatedNote iso={eventsFile?.updatedAt ?? null} />
            {sourcesFile ? <SourcesPanel sources={sourcesFile} /> : <Loading />}
          </div>
        ) : eventsFile ? (
          <EventsBoard
            events={eventsFile.events}
            highlights={eventsFile.highlights}
            query={query}
            updatedAt={eventsFile.updatedAt}
            onQueryChange={setQuery}
          />
        ) : (
          <div className="panel-scroll">
            <Loading />
          </div>
        )}
      </main>
    </div>
    </DateFilterProvider>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function Loading() {
  return (
    <div aria-busy="true" aria-label="Wczytywanie" className="skeleton-list">
      {[0, 1, 2].map((item) => (
        <div className="skeleton-card" key={item}>
          <div className="skeleton-card__media" />
          <div className="skeleton-card__line" />
          <div className="skeleton-card__line skeleton-card__line--short" />
        </div>
      ))}
    </div>
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
