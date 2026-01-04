
export type CalendarInfo = {
  id: string; // This will now be the URL
  title: string;
  url: string;
  color: string;
  primary?: boolean;
};




// Default Colors
export const CALENDAR_COLORS = [
  '#0EA5E9', // Sky 500
  '#F43F5E', // Rose 500
  '#8B5CF6', // Violet 500
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#EC4899', // Pink 500
];

export function getRandomColor() {
  return CALENDAR_COLORS[Math.floor(Math.random() * CALENDAR_COLORS.length)];
}

export async function createCalendar(url: string, existingCalendars: CalendarInfo[], title?: string): Promise<CalendarInfo> {
  if (existingCalendars.some(c => c.url === url)) {
    throw new Error('Calendar already exists');
  }

  let finalTitle = title || 'New Calendar';

  if (!title) {
    // Attempt to fetch title from iCal
    try {
      const { fetchCalendarMetadata } = await import('./ical');
      const metadata = await fetchCalendarMetadata(url);
      if (metadata.title) {
        finalTitle = metadata.title;
      }
    } catch (e) {
      console.warn("Could not fetch calendar metadata", e);
    }
  }

  return {
    id: url, // Use URL as ID for simplicity
    url,
    title: finalTitle,
    color: getRandomColor(),
    primary: existingCalendars.length === 0
  };
}

