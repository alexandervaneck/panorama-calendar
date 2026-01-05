import ICAL from 'ical.js';
import { requestUrl } from 'obsidian';
import type { CalendarEvent } from './events';

export async function fetchCalendarMetadata(url: string): Promise<{ title: string | null }> {
  try {
    // Obsidian's requestUrl handles CORS, so we use the URL directly.
    const response = await requestUrl({ url });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    const text = response.text;

    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    // @ts-ignore - types are incomplete
    const title = comp.getFirstProperty('x-wr-calname')?.getFirstValue() as string | null;

    return { title: title || null };
  } catch (e) {
    console.warn("Failed to fetch calendar metadata", e);
    return { title: null };
  }
}

export async function fetchAndParseIcal(url: string, calendarId: string, calendarTitle: string, color: string): Promise<CalendarEvent[]> {
  try {
    // Obsidian's requestUrl handles CORS, so we use the URL directly.
    const response = await requestUrl({ url });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch iCal data: ${response.status}`);
    }

    const iCalData = response.text;

    // Basic validation
    if (!iCalData.includes('BEGIN:VCALENDAR')) {
      throw new Error('Invalid iCal data');
    }

    const jcalData = ICAL.parse(iCalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    return vevents.map((vevent: any) => {
      const event = new ICAL.Event(vevent);

      const uid = event.uid;
      const summary = event.summary;
      const description = event.description;
      const location = event.location;
      // Access URL from the underlying component (vevent)
      // @ts-ignore
      const htmlLink = vevent.getFirstProperty('url')?.getFirstValue();

      // Handle Start Date
      let start = event.startDate;
      let end = event.endDate;
      let allDay = false;

      // Check if it's an all-day event (isDate is true if it's just a date without time)
      if (start.isDate) {
        allDay = true;
      }

      // Convert to JS Date to ISO string
      const startJsDate = start.toJSDate();
      const endJsDate = end.toJSDate();

      return {
        id: uid,
        calendarId,
        title: summary || '(No Title)',
        start: startJsDate.toISOString(),
        end: endJsDate.toISOString(),
        allDay: allDay,
        color: color,
        calendarTitle: calendarTitle,
        description: description || null,
        location: location || null,
        htmlLink: typeof htmlLink === 'string' ? htmlLink : undefined,
      };
    });
  } catch (err) {
    console.error('Error parsing iCal:', err);
    throw err;
  }
}
