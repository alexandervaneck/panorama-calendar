
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { TopNav } from './components/TopNav';
import {
  cacheYear,
  fetchYearEvents,
  loadCachedYear,
  clearYearCache,
  type CalendarEvent,
} from './lib/events';
import { createCalendar, type CalendarInfo } from './lib/calendars';
import { ViewMode } from './lib/date';
import { useOutsideClick } from './hooks/useOutsideClick';
import type AnnualLinearCalendarPlugin from '../main';

const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth();

export default function App({ plugin }: { plugin: AnnualLinearCalendarPlugin | undefined }) {
  // Initialize state from plugin settings or defaults
  // If plugin is undefined (e.g. dev outside obsidian), fallback to defaults.
  const [year, setYear] = useState(plugin?.settings?.year ?? currentYear);
  const [viewMode, setViewMode] = useState<ViewMode>(plugin?.settings?.viewMode ?? 'date-grid');
  const [calendars, setCalendars] = useState<CalendarInfo[]>(plugin?.settings?.calendars ?? []);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>(plugin?.settings?.selectedCalendars ?? []);

  const weekStart = 0; // Sunday
  const [scrollTargetMonth, setScrollTargetMonth] = useState<number | null>(null);

  const [eventsByYear, setEventsByYear] = useState<Record<string, CalendarEvent[]>>({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [panelEvent, setPanelEvent] = useState<CalendarEvent | null>(null);
  const [navHeight, setNavHeight] = useState<number>(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [calendarsLoading, setCalendarsLoading] = useState(false);

  // Sync state changes to plugin settings
  const persistSettings = async (updates: Partial<{
    year: number;
    viewMode: ViewMode;
    calendars: CalendarInfo[];
    selectedCalendars: string[];
  }>) => {
    if (!plugin) return;

    plugin.settings = {
      ...plugin.settings,
      ...updates
    };
    await plugin.saveSettings();
  };


  const activeCalendars = useMemo(
    () => selectedCalendars,
    [selectedCalendars],
  );

  const activeCalendarInfos = useMemo(() => {
    return calendars.filter(c => selectedCalendars.includes(c.id));
  }, [calendars, selectedCalendars]);

  // Key now depends on selected ID (URLs)
  const selectionKey = `${year}-${activeCalendars.slice().sort().join(',')}`;

  const yearOptions = useMemo(() => {
    const start = currentYear - 5;
    const end = currentYear + 6;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, []);

  // Subscribe to plugin setting changes
  useEffect(() => {
    if (!plugin) return;
    const cleanup = plugin.onSettingsUpdate(() => {
      setYear(plugin.settings.year);
      setViewMode(plugin.settings.viewMode);
      setCalendars(plugin.settings.calendars);
      // Ensure selected calendars are also synced if they change externally (e.g. deletion)
      setSelectedCalendars(plugin.settings.selectedCalendars);
    });
    return cleanup;
  }, [plugin]);

  const handleToday = () => {
    if (year !== currentYear) {
      setYear(currentYear);
      persistSettings({ year: currentYear });
    }
    setScrollTargetMonth(currentMonthIndex);
  };

  // Removed handleAddCalendar and handleRemoveCalendar as they are now in Settings Tab

  useEffect(() => {
    if (scrollTargetMonth === null) return;
    const el = document.querySelector<HTMLElement>(`[data-month="${scrollTargetMonth}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setScrollTargetMonth(null);
  }, [scrollTargetMonth, year, viewMode]);

  useEffect(() => {
    if (selectedEvent) {
      setPanelEvent(selectedEvent);
      return undefined;
    }
    if (!panelEvent) return undefined;
    const timer = window.setTimeout(() => {
      setPanelEvent(null);
    }, 220); // slightly longer than the CSS transition
    return () => window.clearTimeout(timer);
  }, [selectedEvent, panelEvent]);


  useEffect(() => {
    const measureNav = () => {
      const nav = document.querySelector<HTMLElement>('[data-topnav]');
      if (nav) {
        setNavHeight(nav.getBoundingClientRect().height);
      }
    };
    measureNav();
    window.addEventListener('resize', measureNav);
    return () => window.removeEventListener('resize', measureNav);
  }, []);

  useEffect(() => {
    if (!panelEvent) return undefined;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        setSelectedEvent(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [panelEvent]);

  useEffect(() => {
    // If active calendars changed, we might need to fetch.
    if (activeCalendars.length === 0) {
      setEventsByYear(prev => ({ ...prev, [selectionKey]: [] }));
      return;
    }

    const existing = eventsByYear[selectionKey];
    const cached = loadCachedYear(year, activeCalendarInfos);

    if (existing) {
      setEventsLoading(false);
      return;
    }

    if (cached) {
      setEventsByYear((prev) => ({ ...prev, [selectionKey]: cached }));
      setEventsLoading(false);
      return;
    }

    let canceled = false;
    setEventsLoading(true);
    fetchYearEvents(year, activeCalendarInfos)
      .then((events) => {
        if (canceled) return;
        cacheYear(year, activeCalendarInfos, events);
        setEventsByYear((prev) => ({ ...prev, [selectionKey]: events }));
        setLastSync(new Date().toISOString());
      })
      .catch((error) => {
        console.error('Failed to fetch events', error);
      })
      .finally(() => {
        if (!canceled) setEventsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [year, activeCalendars, selectionKey, activeCalendarInfos]);




  const displayedEvents = useMemo(() => {
    const list = eventsByYear[selectionKey] ?? [];
    if (!activeCalendars.length) return [];
    return list.filter((evt) => activeCalendars.includes(evt.calendarId));
  }, [eventsByYear, selectionKey, activeCalendars]);

  const openPanel = (evt: CalendarEvent) => {
    setPanelEvent(evt);
    // Defer setting "open" state so the translate animation can start from closed.
    requestAnimationFrame(() => setSelectedEvent(evt));
  };

  const closePanel = () => {
    setSelectedEvent(null);
  };

  // Close calendar menu when clicking outside.
  const calendarMenuRef = useRef<HTMLDivElement>(null!);
  const calendarButtonRef = useRef<HTMLButtonElement>(null!);
  useOutsideClick(
    [calendarMenuRef],
    () => setCalendarMenuOpen(false),
    { ignore: [calendarButtonRef], enabled: calendarMenuOpen },
  );

  // Close panel when clicking outside.
  useOutsideClick([panelRef], () => setSelectedEvent(null), { enabled: !!panelEvent });

  return (
    <div className="min-h-screen bg-surface-50 text-slate-900">
      <TopNav
        year={year}
        availableYears={yearOptions}
        onYearChange={(y) => {
          setYear(y);
          persistSettings({ year: y });
        }}

        onToday={handleToday}
        todayYear={currentYear}

        calendars={calendars}

        selectedCalendars={selectedCalendars}
        calendarsLoading={calendarsLoading}
        calendarMenuOpen={calendarMenuOpen}
        onToggleCalendarMenu={() => setCalendarMenuOpen((open) => !open)}

        onToggleCalendar={(id) => {
          setSelectedCalendars((prev) => {
            const exists = prev.includes(id);
            let next: string[];
            if (exists) {
              next = prev.filter((c) => c !== id);
            } else {
              next = [...prev, id];
            }
            persistSettings({ selectedCalendars: next });
            return next;
          });
        }}
        onSync={async () => {
          // Simplified sync - just refetch events since calendars are local now
          clearYearCache(year, activeCalendarInfos);
          setEventsLoading(true);
          fetchYearEvents(year, activeCalendarInfos)
            .then((events) => {
              cacheYear(year, activeCalendarInfos, events);
              setEventsByYear((prev) => ({ ...prev, [selectionKey]: events }));
              setLastSync(new Date().toISOString());
            })
            .catch((error) => console.error('Failed to refresh events', error))
            .finally(() => {
              setEventsLoading(false);
            });
        }}
        onOpenSettings={() => plugin?.openSettings()}
        isSyncing={eventsLoading}
        calendarMenuRef={calendarMenuRef}
        calendarButtonRef={calendarButtonRef}
      />


      <div className="px-4 pt-2 text-[10px] text-slate-500 flex justify-end">
        {lastSync ? (
          <span>
            Last sync: {new Date(lastSync).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        ) : (
          <span>Not synced yet</span>
        )}
      </div>

      <main className="pt-2">
        <CalendarGrid
          year={year}
          viewMode={viewMode}
          weekStart={weekStart}
          events={displayedEvents}
          loading={eventsLoading}
          onSelectEvent={(evt) => openPanel(evt)}
        />
      </main>

      {panelEvent && (
        <aside
          className={`fixed right-0 bottom-0 z-20 w-80 max-w-md transform border-l border-slate-200 bg-white shadow-xl transition-transform duration-200 ${selectedEvent ? 'translate-x-0' : 'translate-x-full pointer-events-none opacity-0'
            }`}
          style={navHeight ? { top: navHeight } : undefined}
          ref={panelRef}
        >
          {panelEvent && (
            <>
              <div
                className="sticky top-0 z-10 flex items-center justify-between border-b-4 bg-white p-4"
                style={{ borderColor: panelEvent.color || '#0ea5e9' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: panelEvent.color || '#0ea5e9' }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-slate-700">Event</span>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  onClick={closePanel}
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div className="rounded-lg border border-transparent px-3 py-2 text-xl font-semibold text-slate-900 hover:border-slate-200">
                  <div className="break-words">{panelEvent.title}</div>
                </div>

                {panelEvent.allDay && (
                  <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    All day
                  </div>
                )}

                <div className="space-y-2">
                  <DateRow label="Start" value={panelEvent.start} showTime={!panelEvent.allDay} />
                  <DateRow label="End" value={panelEvent.end} showTime={!panelEvent.allDay} />
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span>{relativeText(panelEvent.start)}</span>
                </div>

                {panelEvent.description ? (
                  <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <div className="whitespace-pre-wrap break-words">{panelEvent.description}</div>
                  </div>
                ) : null}

                {panelEvent.htmlLink && (
                  <div className="flex items-center justify-start gap-2 rounded-lg bg-sky-50 p-2 text-xs text-sky-600">
                    <a
                      href={panelEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors hover:bg-sky-100"
                      aria-label="Open in Google Calendar"
                    >
                      <span>See in Google Calendar</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}

function DateRow({ label, value, showTime }: { label: string; value: string; showTime?: boolean }) {
  const date = new Date(value);
  const parsedDate = typeof value === 'string' ? value.slice(0, 10) : '';
  const isValid = !Number.isNaN(date.getTime());
  const dateOnly = parsedDate && parsedDate.length === 10 ? parsedDate : isValid ? date.toISOString().slice(0, 10) : '';
  const time =
    showTime && isValid ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '';
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 flex-shrink-0 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
      <input
        type="date"
        className="flex-1 rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:hover:border-transparent"
        value={dateOnly}
        readOnly
        disabled
      />
      {showTime && (
        <input
          type="time"
          className="w-24 rounded-lg border border-transparent px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:hover:border-transparent"
          value={time}
          readOnly
          disabled
        />
      )}
    </div>
  );
}

function relativeText(iso: string) {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
