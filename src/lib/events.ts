import { type App } from 'obsidian';
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

function cacheKey(year: number, calendar: CalendarInfo) {
  return `${CACHE_VERSION}-events-year-${year}-${calendar.id}`;
}

export function loadCachedYear(app: App, year: number, calendar: CalendarInfo): CalendarEvent[] | null {
  try {
    const raw = app.loadLocalStorage(cacheKey(year, calendar));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedYear;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.events;
  } catch {
    return null;
  }
}

export function cacheYear(app: App, year: number, calendar: CalendarInfo, events: CalendarEvent[]) {
  try {
    const payload: CachedYear = { events, cachedAt: Date.now() };
    app.saveLocalStorage(cacheKey(year, calendar), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearYearCache(app: App, year: number, calendar: CalendarInfo) {
  try {
    app.saveLocalStorage(cacheKey(year, calendar), null);
  } catch {
    // ignore
  }
}

export function clearAllEventCaches() {
  try {
    // clearing all is hard with saveLocalStorage/loadLocalStorage without knowing keys,
    // usually we don't need a "clear all" unless for debugging.
  } catch {
    // ignore
  }
}

export async function fetchCalendarYearEvents(year: number, calendar: CalendarInfo): Promise<CalendarEvent[]> {
  try {
    const events = await fetchAndParseIcal(calendar.url, calendar.id, calendar.title, calendar.color);

    return events.filter(e => {
      const s = new Date(e.start);
      const end = new Date(e.end);
      return s.getFullYear() === year || end.getFullYear() === year;
    });
  } catch (e) {
    console.error(`Failed to fetch calendar ${calendar.title}`, e);
    return [];
  }
}

/**
 * @deprecated Use fetchCalendarYearEvents instead
 */
export async function fetchYearEvents(year: number, calendars: CalendarInfo[]): Promise<CalendarEvent[]> {
  if (calendars.length === 0) return [];

  let allEvents: CalendarEvent[] = [];

  const promises = calendars.map(cal => fetchCalendarYearEvents(year, cal));
  const results = await Promise.all(promises);
  results.forEach(arr => allEvents = allEvents.concat(arr));

  return allEvents;
}
