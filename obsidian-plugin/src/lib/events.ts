
import { fetchAndParseIcal } from './ical';
import type { CalendarInfo } from './calendars';

export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay?: boolean;
  color?: string;
  colorId?: string;
  calendarTitle?: string;
  htmlLink?: string;
  description?: string | null;
  location?: string | null;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_VERSION = 'v11_ical'; // Bump version

type CachedYear = {
  events: CalendarEvent[];
  cachedAt: number;
};

function normalizeCalendars(calendars: CalendarInfo[]) {
  return calendars.map(c => c.id).sort();
}

function cacheKey(year: number, calendars: CalendarInfo[]) {
  const normalized = normalizeCalendars(calendars);
  const calKey = normalized.length ? normalized.length + '-' + normalized.map(s => s.slice(-10)).join('') : 'none';
  return `${CACHE_VERSION}-events-year-${year}-${calKey}`;
}

export function loadCachedYear(year: number, calendars: CalendarInfo[]): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(year, calendars));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedYear;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.events;
  } catch {
    return null;
  }
}

export function cacheYear(year: number, calendars: CalendarInfo[], events: CalendarEvent[]) {
  try {
    const payload: CachedYear = { events, cachedAt: Date.now() };
    localStorage.setItem(cacheKey(year, calendars), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearYearCache(year: number, calendars: CalendarInfo[]) {
  try {
    localStorage.removeItem(cacheKey(year, calendars));
  } catch {
    // ignore
  }
}

export function clearAllEventCaches() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${CACHE_VERSION}-`))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export async function fetchYearEvents(year: number, calendars: CalendarInfo[]): Promise<CalendarEvent[]> {
  if (calendars.length === 0) return [];

  let allEvents: CalendarEvent[] = [];

  // Parallel fetch
  const promises = calendars.map(async (cal) => {
    try {
      const events = await fetchAndParseIcal(cal.url, cal.id, cal.title, cal.color);

      return events.filter(e => {
        const s = new Date(e.start);
        const end = new Date(e.end);
        return s.getFullYear() === year || end.getFullYear() === year;
      });

    } catch (e) {
      console.error(`Failed to fetch calendar ${cal.title}`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach(arr => allEvents = allEvents.concat(arr));

  return allEvents;
}
