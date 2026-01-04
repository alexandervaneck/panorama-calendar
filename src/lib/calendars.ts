
export type CalendarInfo = {
  id: string; // This will now be the URL
  title: string;
  url: string;
  color: string;
  primary?: boolean;
};

const CALENDARS_STORAGE_KEY = 'panorama_custom_calendars';

// Default Colors
const COLORS = [
  '#0EA5E9', // Sky 500
  '#F43F5E', // Rose 500
  '#8B5CF6', // Violet 500
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#EC4899', // Pink 500
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export async function fetchCalendars(): Promise<CalendarInfo[]> {
  try {
    const raw = localStorage.getItem(CALENDARS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CalendarInfo[];
  } catch {
    return [];
  }
}


export async function addCalendar(url: string, title?: string): Promise<CalendarInfo> {
  const current = await fetchCalendars();
  if (current.some(c => c.url === url)) {
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

  const newCal: CalendarInfo = {
    id: url, // Use URL as ID for simplicity
    url,
    title: finalTitle,
    color: getRandomColor(),
    primary: current.length === 0
  };

  const updated = [...current, newCal];
  localStorage.setItem(CALENDARS_STORAGE_KEY, JSON.stringify(updated));
  return newCal;
}


export async function removeCalendar(id: string): Promise<void> {
  const current = await fetchCalendars();
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(CALENDARS_STORAGE_KEY, JSON.stringify(updated));
}

