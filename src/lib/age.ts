export interface AgeRange {
  min: number;
  max: number | null;
}

const RANGE = /(\d+)\s*[\u2013\u2014-]\s*(\d+)\s*lat/gi;
const COHORT = /roczniki\s*(\d{4})\s*[\u2013\u2014-]\s*(\d{4})/gi;
const FROM_TO = /od\s+(?:ok\.\s*)?(\d+)\s*lat[\s\S]*?do\s+(\d+)\s*lat/i;
const FROM = /od\s+(?:ok\.\s*)?(\d+)\s*lat/i;
const UP_TO = /(?:dzieci\s+)?do\s+(\d+)\s*lat/i;

function eventYear(startDate: string | null): number {
  if (startDate && /^\d{4}/.test(startDate)) return Number(startDate.slice(0, 4));
  return new Date().getFullYear();
}

/** Turn the free-text age column into a numeric range. Null means "any age". */
export function ageRange(age: string, startDate: string | null): AgeRange | null {
  const year = eventYear(startDate);
  const ranges: AgeRange[] = [];

  for (const match of age.matchAll(RANGE)) {
    ranges.push({ min: Number(match[1]), max: Number(match[2]) });
  }

  for (const match of age.matchAll(COHORT)) {
    const olderBirthYear = Math.min(Number(match[1]), Number(match[2]));
    const youngerBirthYear = Math.max(Number(match[1]), Number(match[2]));
    ranges.push({ min: year - youngerBirthYear, max: year - olderBirthYear });
  }

  const fromTo = age.match(FROM_TO);
  if (fromTo) ranges.push({ min: Number(fromTo[1]), max: Number(fromTo[2]) });

  if (ranges.length === 0) {
    if (/od\s+przedszkola/i.test(age)) return { min: 4, max: null };
    if (/szkoły podstawowej/i.test(age)) return { min: 6, max: 12 };
    if (/najmłodsi/i.test(age)) return { min: 2, max: 5 };
    const from = age.match(FROM);
    if (from) return { min: Number(from[1]), max: null };
    const upTo = age.match(UP_TO);
    if (upTo && !/wszysc|wszystk|brak info/i.test(age)) return { min: 0, max: Number(upTo[1]) };
    return null;
  }

  const min = Math.min(...ranges.map((range) => range.min));
  const max = ranges.some((range) => range.max === null)
    ? null
    : Math.max(...ranges.map((range) => range.max ?? 0));
  return { min, max };
}

export function matchesAge(age: string, childAge: number, startDate: string | null): boolean {
  const range = ageRange(age, startDate);
  if (!range) return true;
  if (childAge < range.min) return false;
  if (range.max !== null && childAge > range.max) return false;
  return true;
}
