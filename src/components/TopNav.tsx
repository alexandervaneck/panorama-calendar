import { type RefObject } from 'react';

type TopNavProps = {
  year: number;
  availableYears: number[];
  onYearChange: (year: number) => void;

  onToday: () => void;
  todayYear: number;
  onSync?: () => void;
  isSyncing?: boolean;
  calendars: { id: string; title: string; color?: string | null; primary?: boolean; url?: string }[];
  selectedCalendars: string[];
  calendarsLoading?: boolean;
  calendarMenuOpen?: boolean;
  onToggleCalendarMenu?: () => void;
  onToggleCalendar?: (id: string) => void;
  calendarMenuRef?: RefObject<HTMLDivElement>;
  calendarButtonRef?: RefObject<HTMLButtonElement>;
  onOpenSettings: () => void;
};


export function TopNav({
  year,
  onYearChange,

  onToday,
  todayYear,
  onSync,
  isSyncing,
  calendars,
  selectedCalendars,
  calendarsLoading,
  calendarMenuOpen,
  onToggleCalendarMenu,
  onToggleCalendar,
  calendarMenuRef,
  calendarButtonRef,
  onOpenSettings,
}: TopNavProps) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur"
      data-topnav
    >
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M6 4H4v16h2M18 4h2v16h-2" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Panorama Calendar</div>
              <div className="text-lg font-semibold text-slate-900">Year overview</div>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => onYearChange(year - 1)}
              className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-r border-slate-200"
              title="Previous year"
              aria-label="Previous year"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="px-3 py-2 text-sm font-semibold text-slate-900 min-w-[3.5rem] text-center flex items-center justify-center">
              {year}
            </span>
            <button
              onClick={() => onYearChange(year + 1)}
              className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l border-slate-200"
              title="Next year"
              aria-label="Next year"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
            title={`Go to ${todayYear} and scroll to today`}
            onClick={onToday}
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
              onClick={onToggleCalendarMenu}
              data-calendars-button
              ref={calendarButtonRef}
            >
              Calendars
            </button>
            {calendarMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-20"
                data-calendars-menu
                ref={calendarMenuRef}
              >
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Calendars</span>
                </div>
                <div className="max-h-64 overflow-auto">
                  {calendarsLoading ? (
                    <div className="p-3 text-sm text-slate-500">Loading calendars…</div>
                  ) : calendars.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 italic">No calendars added.</div>
                  ) : (
                    calendars.map((cal) => (
                      <div key={cal.id} className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                        <label
                          className="flex flex-1 items-center gap-2 text-sm text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            checked={selectedCalendars.includes(cal.id)}
                            onChange={() => onToggleCalendar?.(cal.id)}
                          />
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cal.color || '#0ea5e9' }}
                            aria-hidden="true"
                          />
                          <span className="truncate flex-1" title={cal.url || cal.title}>{cal.title}</span>
                        </label>

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>



          {onSync && (
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-60"
              title="Refresh events"
              onClick={onSync}
              aria-label="Refresh events"
              disabled={isSyncing}
            >
              <svg
                className={`h-4 w-4 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.88-3.36L23 10" />
                <path d="M20.49 15A9 9 0 0 1 5.61 18.36L1 14" />
              </svg>
            </button>
          )}

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
            title="Open settings"
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>


        </div>
      </div>
    </header>
  );
}

