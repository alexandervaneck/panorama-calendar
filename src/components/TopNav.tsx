
import { ViewMode } from '../lib/date';
import { useRef, type RefObject } from 'react';

type TopNavProps = {
  year: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToday: () => void;
  todayYear: number;
  onAddCalendar: () => void;
  onRemoveCalendar: (id: string) => void;
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
};

const viewLabels: Record<ViewMode, string> = {
  'date-grid': 'Date Grid',
  'fixed-week': 'Fixed Week',
  'cyclical': 'Cyclical',
};

export function TopNav({
  year,
  availableYears,
  onYearChange,
  viewMode,
  onViewModeChange,
  onToday,
  todayYear,
  onAddCalendar,
  onRemoveCalendar,
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
}: TopNavProps) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur"
      data-topnav
    >
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-sky-500">
              <img src="/favicon.png" alt="Panorama Calendar" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Panorama Calendar</div>
              <div className="text-lg font-semibold text-slate-900">Year overview</div>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => onYearChange(year - 1)}
              className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-l-lg"
              title="Previous year"
              aria-label="Previous year"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="px-2 text-sm font-semibold text-slate-900 min-w-[3rem] text-center">
              {year}
            </span>
            <button
              onClick={() => onYearChange(year + 1)}
              className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-r-lg"
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
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:text-slate-900"
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
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:text-slate-900"
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
                  <button
                    onClick={onAddCalendar}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    + Add URL
                  </button>
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
                        <button
                          type="button"
                          className="ml-2 hidden p-1 text-slate-400 hover:text-red-600 group-hover:block"
                          aria-label="Remove calendar"
                          title="Remove calendar"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove calendar "${cal.title}"?`)) {
                              onRemoveCalendar(cal.id);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm shadow-inner">
            {(Object.keys(viewLabels) as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-md px-3 py-2 font-medium transition ${viewMode === mode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
                aria-pressed={viewMode === mode}
                onClick={() => onViewModeChange(mode)}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>

          {onSync && (
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:text-slate-900 disabled:opacity-60"
              title="Refresh events"
              onClick={onSync}
              aria-label="Refresh events"
              disabled={isSyncing}
            >
              <svg
                className={`h-3 w-3 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`}
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


        </div>
      </div>
    </header>
  );
}

