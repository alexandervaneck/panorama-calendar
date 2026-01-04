
import { fetchAndParseIcal } from './ical';
import { fetchCalendars } from './calendars';

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

function normalizeCalendars(calendars?: string[]) {
  const list = Array.isArray(calendars) ? calendars.filter(Boolean) : [];
  return Array.from(new Set(list)).sort();
}

function cacheKey(year: number, calendars: string[]) {
  // Use a hash or just join the URLs. Since URLs are long, maybe just use a simple join if not too many.
  // For safety/length, we might want to hash, but for MVP local storage, string join is probably fine if not huge.
  const normalized = normalizeCalendars(calendars);
  // Simple "checksum"
  const calKey = normalized.length ? normalized.length + '-' + normalized.map(s => s.slice(-10)).join('') : 'none';
  return `${CACHE_VERSION}-events-year-${year}-${calKey}`;
}

export function loadCachedYear(year: number, calendars: string[]): CalendarEvent[] | null {
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

export function cacheYear(year: number, calendars: string[], events: CalendarEvent[]) {
  try {
    const payload: CachedYear = { events, cachedAt: Date.now() };
    localStorage.setItem(cacheKey(year, calendars), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearYearCache(year: number, calendars: string[]) {
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

export async function fetchYearEvents(year: number, calendarIds: string[]): Promise<CalendarEvent[]> {
  // In our new model, calendarIds ARE the URLs.
  // However, we need the calendar metadata (color, title) to hydration.
  // So we fetch all known calendars and find the ones matching the IDs (URLs).

  const allCalendars = await fetchCalendars();
  const targetedCalendars = allCalendars.filter(c => calendarIds.includes(c.id));

  if (targetedCalendars.length === 0) return [];

  let allEvents: CalendarEvent[] = [];

  // Parallel fetch
  const promises = targetedCalendars.map(async (cal) => {
    try {
      const events = await fetchAndParseIcal(cal.url, cal.id, cal.title, cal.color);
      // Filter by year if necessary? 
      // ical.js usually returns all events. We should filter them here to optimize rendering
      // and ensure we only cache/return relevant year's events if strictly needed, 
      // but the UI filters too. Let's filter slightly to reduce memory.

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
