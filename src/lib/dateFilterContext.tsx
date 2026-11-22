import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_DATE, readDateFromLocation, writeDateToLocation } from "./dateQuery";
import { msUntilNextZurichMidnight, zurichToday } from "./dates";
import type { DateFilter } from "../types";

interface DateFilterApi {
  /** Europe/Zurich calendar day. Updates after midnight without a reload. */
  today: string;
  date: DateFilter;
  customFrom: string;
  customTo: string;
  setDate: (date: DateFilter) => void;
  setCustomFrom: (value: string) => void;
  setCustomTo: (value: string) => void;
  clearDate: () => void;
}

const DateFilterContext = createContext<DateFilterApi | null>(null);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => zurichToday());
  const [date, setDateState] = useState<DateFilter>(() => readDateFromLocation());
  const [customFrom, setCustomFromState] = useState(() => (date.kind === "custom" ? date.from : ""));
  const [customTo, setCustomToState] = useState(() => (date.kind === "custom" ? date.to : ""));
  const customRef = useRef({ from: customFrom, to: customTo });
  customRef.current = { from: customFrom, to: customTo };

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      setToday(zurichToday());
      const delay = msUntilNextZurichMidnight() + 250;
      timer = window.setTimeout(arm, Math.max(delay, 1000));
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      arm();
    };
    arm();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      const next = readDateFromLocation();
      setDateState(next);
      if (next.kind === "custom") {
        setCustomFromState(next.from);
        setCustomToState(next.to);
        customRef.current = { from: next.from, to: next.to };
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setDate = useCallback((next: DateFilter) => {
    setDateState(next);
    if (next.kind === "custom") {
      setCustomFromState(next.from);
      setCustomToState(next.to);
      customRef.current = { from: next.from, to: next.to };
    }
    writeDateToLocation(next);
  }, []);

  const setCustomFrom = useCallback((value: string) => {
    const next: DateFilter = { kind: "custom", from: value, to: customRef.current.to };
    customRef.current = { from: value, to: next.to };
    setCustomFromState(value);
    setDateState(next);
    writeDateToLocation(next);
  }, []);

  const setCustomTo = useCallback((value: string) => {
    const next: DateFilter = { kind: "custom", from: customRef.current.from, to: value };
    customRef.current = { from: next.from, to: value };
    setCustomToState(value);
    setDateState(next);
    writeDateToLocation(next);
  }, []);

  const clearDate = useCallback(() => {
    const next: DateFilter = DEFAULT_DATE;
    customRef.current = { from: "", to: "" };
    setCustomFromState("");
    setCustomToState("");
    setDateState(next);
    writeDateToLocation(next);
  }, []);

  const api = useMemo<DateFilterApi>(
    () => ({ today, date, customFrom, customTo, setDate, setCustomFrom, setCustomTo, clearDate }),
    [clearDate, customFrom, customTo, date, setCustomFrom, setCustomTo, setDate, today],
  );

  return <DateFilterContext.Provider value={api}>{children}</DateFilterContext.Provider>;
}

export function useDateFilter(): DateFilterApi {
  const value = useContext(DateFilterContext);
  if (!value) throw new Error("Brak DateFilterProvider");
  return value;
}
