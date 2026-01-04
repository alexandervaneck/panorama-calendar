import clsx from 'clsx';
import {
  ViewMode,
  daysInMonth,
  isToday,
  isWeekend,
  monthLabels,
  weekdayLabels,
  weekdayOffset,
  getQuarterStructure,
  type CycleRow,
} from '../lib/date';
import type { CalendarEvent } from '../lib/events';

type CalendarGridProps = {
  year: number;
  viewMode: ViewMode;
  weekStart?: number;
  events?: CalendarEvent[];
  loading?: boolean;
  onSelectEvent?: (event: CalendarEvent) => void;
};

type EventSegment = {
  eventId: string;
  title: string;
  xStart: number;
  width: number;
  lane: number;
  color?: string;
  source: CalendarEvent;
};

const MONTHS = Array.from({ length: 12 }, (_, index) => index);
const DATE_GRID_COLUMNS = 31;
const MONTH_COL_WIDTH = '40px';
const EVENT_ROW_HEIGHT = 24;
const CELL_BASE_PADDING = 13; // base padding for event stack (was 8, +5 per request)
const HALF_EVENT_PADDING = EVENT_ROW_HEIGHT / 2;

function paddingForLanes(laneCount: number) {
  return CELL_BASE_PADDING + Math.max(0, laneCount * EVENT_ROW_HEIGHT - HALF_EVENT_PADDING);
}

export function CalendarGrid({
  year,
  viewMode,
  weekStart = 0,
  events = [],
  loading,
  onSelectEvent,
}: CalendarGridProps) {
  const fixedWeekColumns =
    viewMode === 'fixed-week'
      ? Math.max(
        ...MONTHS.map(
          (monthIndex) => weekdayOffset(year, monthIndex, weekStart) + daysInMonth(year, monthIndex),
        ),
      )
      : null;

  return (
    <section className="mx-auto w-full space-y-4 px-4 pb-10">
      {viewMode === 'date-grid' ? (
        <DateGridTable year={year} events={events} onSelectEvent={onSelectEvent} />
      ) : viewMode === 'cyclical' ? (
        <CyclicalTable year={year} events={events} onSelectEvent={onSelectEvent} />
      ) : (
        fixedWeekColumns && (
          <FixedWeekTable
            year={year}
            weekStart={weekStart}
            columns={fixedWeekColumns}
            events={events}
            onSelectEvent={onSelectEvent}
          />
        )
      )}
      {loading && <div className="px-4 text-sm text-slate-500">Loading events…</div>}
    </section>
  );
}

const DATE_COL_MIN_WIDTH = '32px';

function DateGridTable({
  year,
  events,
  onSelectEvent,
}: {
  year: number;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
}) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="grid border-b border-slate-200 text-sm font-semibold text-slate-700"
        style={{
          gridTemplateColumns: `${MONTH_COL_WIDTH} repeat(${DATE_GRID_COLUMNS}, minmax(${DATE_COL_MIN_WIDTH}, 1fr))`,
        }}
      >
        <div className="border-r border-slate-200" />
        {/* Header row removed as weekday varies per month */}
      </div>

      <div className="divide-y divide-slate-200 text-xs font-normal">
        {MONTHS.map((monthIndex) => (
          <MonthRow
            key={monthIndex}
            year={year}
            monthIndex={monthIndex}
            events={events}
            viewMode="date-grid"
            weekStart={0}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
}

type MonthRowProps = {
  year: number;
  monthIndex: number;
  events: CalendarEvent[];
  viewMode: ViewMode;
  weekStart: number;
  onSelectEvent?: (event: CalendarEvent) => void;
};

function MonthRow({ year, monthIndex, events, viewMode, weekStart, onSelectEvent }: MonthRowProps) {
  const totalDays = daysInMonth(year, monthIndex);
  const segments = buildSegments(events, year, monthIndex, viewMode, weekStart);
  const laneCount = segments.length ? Math.max(...segments.map((s) => s.lane)) + 1 : 0;
  const cellPaddingBottom = paddingForLanes(laneCount);

  return (
    <div className="relative" data-month={monthIndex}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${MONTH_COL_WIDTH} repeat(${DATE_GRID_COLUMNS}, minmax(${DATE_COL_MIN_WIDTH}, 1fr))`,
        }}
      >
        <div
          className="flex items-center justify-center border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 month-label-large"
          style={{ width: MONTH_COL_WIDTH, fontSize: '10px' }}
        >
          <div className="-rotate-90 transform whitespace-nowrap">{monthLabels[monthIndex].slice(0, 3)}</div>
          <span className="sr-only">{totalDays} days</span>
        </div>

        {Array.from({ length: DATE_GRID_COLUMNS }, (_, index) => {
          const day = index + 1;
          const isInMonth = day <= totalDays;
          const date = new Date(year, monthIndex, day);
          const weekday = date.getDay();
          const weekend = isWeekend(weekday);
          const today = isInMonth && isToday(year, monthIndex, day);

          return (
            <div
              key={day}
              className={clsx(
                'group relative flex min-h-[72px] flex-col gap-0 border-r border-gray-200 p-0 transition-colors hover:bg-gray-50',
                weekend && isInMonth ? 'bg-sky-50 hover:bg-sky-100' : 'bg-white',
                !isInMonth && 'bg-gray-50 text-slate-300',
                today && 'outline outline-2 outline-amber-500 outline-offset-[-3px]',
              )}
              style={{ paddingBottom: cellPaddingBottom }}
            >
              {isInMonth && (
                <div className="p-0">
                  <div
                    className={clsx(
                      'flex h-6 w-auto min-w-[24px] px-1 items-center justify-center rounded-full text-[10px] font-semibold transition-colors group-hover:bg-gray-100',
                      weekend ? 'text-sky-700 group-hover:bg-sky-100' : 'text-gray-700',
                    )}
                  >
                    {day} <span className='text-[8px] text-gray-400 ml-0.5'>{weekdayLabels[weekday].slice(0, 3)}</span>
                  </div>
                </div>
              )}
              {today && (
                <div
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500"
                  aria-label="Today"
                />
              )}
            </div>
          );
        })}
      </div>

      {segments.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0 top-6 grid"
          style={{
            gridTemplateColumns: `${MONTH_COL_WIDTH} repeat(${DATE_GRID_COLUMNS}, minmax(${DATE_COL_MIN_WIDTH}, 1fr))`,
            gridAutoRows: '24px',
          }}
        >
          {segments.map((segment) => (
            <div
              key={`${segment.eventId}-${segment.lane}-${segment.xStart}`}
              className="pointer-events-auto -ml-px"
              style={{
                gridColumn: `${segment.xStart + 2} / span ${segment.width}`,
                gridRowStart: segment.lane + 1,
              }}
              onClick={() => onSelectEvent && onSelectEvent(segment.source)}
            >
              <div
                className="flex h-5 items-center gap-1 truncate rounded-full px-2 text-[11px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: segment.color || '#0ea5e9' }}
              >
                <span className="truncate">{segment.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FixedWeekTable({
  year,
  weekStart,
  columns,
  events,
  onSelectEvent,
}: {
  year: number;
  weekStart: number;
  columns: number;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
}) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="grid border-b border-slate-200 text-sm font-semibold text-slate-700"
        style={{
          gridTemplateColumns: `${MONTH_COL_WIDTH} repeat(${columns}, minmax(32px, 1fr))`,
        }}
      >
        <div className="border-r border-slate-200" />
        {Array.from({ length: columns }, (_, index) => {
          const weekday = (weekStart + index) % 7;
          return (
            <div
              key={index}
              className={clsx(
                "flex items-center justify-center border-r border-gray-200 px-1 py-1 text-center text-[10px] font-semibold text-gray-600 calendar-cell",
                (weekday === 0 || weekday === 6) ? "bg-sky-50 text-sky-700" : "bg-gray-50",
              )}
            >
              <span className="weekday-header-label">{weekdayLabels[weekday].slice(0, 2)}</span>
            </div>
          );
        })}
      </div>

      <div className="divide-y divide-slate-200 text-xs font-normal">
        {MONTHS.map((monthIndex) => (
          <FixedWeekRow
            key={monthIndex}
            year={year}
            monthIndex={monthIndex}
            weekStart={weekStart}
            columns={columns}
            events={events}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
}

function FixedWeekRow({
  year,
  monthIndex,
  weekStart,
  columns,
  events,
  onSelectEvent,
}: {
  year: number;
  monthIndex: number;
  weekStart: number;
  columns: number;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
}) {
  const totalDays = daysInMonth(year, monthIndex);
  const offset = weekdayOffset(year, monthIndex, weekStart);
  const segments = buildSegments(events, year, monthIndex, 'fixed-week', weekStart, columns);
  const laneCount = segments.length ? Math.max(...segments.map((s) => s.lane)) + 1 : 0;
  const cellPaddingBottom = paddingForLanes(laneCount);

  return (
    <div className="relative" data-month={monthIndex}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${MONTH_COL_WIDTH} repeat(${columns}, minmax(32px, 1fr))`,
        }}
      >
        <div
          className="flex items-center justify-center border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 month-label-large"
          style={{ width: MONTH_COL_WIDTH, fontSize: '10px' }}
        >
          <div className="-rotate-90 transform whitespace-nowrap">{monthLabels[monthIndex].slice(0, 3)}</div>
          <span className="sr-only">{totalDays} days</span>
        </div>

        {Array.from({ length: columns }, (_, index) => {
          const weekday = (weekStart + index) % 7;
          const day = index - offset + 1;
          const isInMonth = day >= 1 && day <= totalDays;
          const today = isInMonth && isToday(year, monthIndex, day);

          return (
            <div
              key={index}
              className={clsx(
                'group relative flex min-h-[72px] flex-col gap-0 border-r border-gray-200 p-0 transition-colors hover:bg-gray-50',
                isInMonth && isWeekend(weekday) ? 'bg-sky-50 hover:bg-sky-100' : 'bg-white',
                !isInMonth && 'bg-gray-50 text-slate-300',
                today && 'outline outline-2 outline-amber-500 outline-offset-[-3px]',
              )}
              style={{ paddingBottom: cellPaddingBottom }}
            >
              {isInMonth && (
                <div className="p-0">
                  <div
                    className={clsx(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors group-hover:bg-gray-100',
                      isWeekend(weekday) ? 'text-sky-700 group-hover:bg-sky-100' : 'text-gray-700',
                    )}
                  >
                    {day}
                  </div>
                </div>
              )}
              {today && (
                <div
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500"
                  aria-label="Today"
                />
              )}
            </div>
          );
        })}
      </div>

      {segments.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0 top-6 grid"
          style={{
            gridTemplateColumns: `${MONTH_COL_WIDTH} repeat(${columns}, minmax(32px, 1fr))`,
            gridAutoRows: '24px',
          }}
        >
          {segments.map((segment) => (
            <div
              key={`${segment.eventId}-${segment.lane}-${segment.xStart}`}
              className="pointer-events-auto"
              style={{
                gridColumn: `${segment.xStart + 2} / span ${segment.width}`,
                gridRowStart: segment.lane + 1,
              }}
              onClick={() => onSelectEvent && onSelectEvent(segment.source)}
            >
              <div
                className="flex h-5 items-center gap-1 truncate rounded-full px-2 text-[11px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: segment.color || '#0ea5e9' }}
              >
                <span className="truncate">{segment.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function CyclicalTable({
  year,
  events,
  onSelectEvent,
}: {
  year: number;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
}) {
  const rows = getQuarterStructure(year);

  // Headers: We need 28 columns (4 weeks of Mon-Sun)
  // But wait, user requested: "Headers: Mon, Tue... repeated 4 times"
  // Assuming standard week start (Monday? Or Sunday? TopNav passes default 0 which is Sunday usually, but standard iso is Mon.
  // The DateGrid assumes 0=index. DateGridTable does (index+0)%7.
  // Check index. Weekday 0 is usually Sun. 
  // User asked "M T W T F S S" in image, which is Mon-Sun.
  // I will enforce Mon-Sun (Indices 1-6, 0).
  const cyclicalWeek = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue... Sun

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="grid border-b border-slate-200 text-sm font-semibold text-slate-700"
        style={{
          gridTemplateColumns: `56px repeat(28, minmax(32px, 1fr))`,
        }}
      >
        <div className="border-r border-slate-200 bg-gray-50 text-[10px] flex items-center justify-center p-1">
          Cycle
        </div>
        {Array.from({ length: 28 }, (_, index) => {
          // index 0..27.
          // Week index = Math.floor(index / 7).
          // Day index in week = index % 7.
          const dayIndex = index % 7;
          const weekday = cyclicalWeek[dayIndex];
          return (
            <div
              key={index}
              className={clsx(
                "flex items-center justify-center border-r border-gray-200 px-1 py-1 text-center text-[10px] font-semibold text-gray-600 calendar-cell",
                weekday === 0 || weekday === 6 ? "bg-sky-50 text-sky-700" : "bg-gray-50",
              )}
            >
              <span className="weekday-header-label">{weekdayLabels[weekday].slice(0, 1)}</span>
            </div>
          );
        })}
      </div>

      <div className="divide-y divide-slate-200 text-xs font-normal">
        {rows.map((row) => (
          <CyclicalRow
            key={row.label}
            row={row}
            year={year}
            events={events}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
}

function CyclicalRow({
  row,
  year,
  events,
  onSelectEvent,
}: {
  row: CycleRow;
  year: number;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
}) {
  const segments = buildSegments(events, year, 0, 'cyclical', 0, 0, row);
  const laneCount = segments.length ? Math.max(...segments.map((s) => s.lane)) + 1 : 0;
  const cellPaddingBottom = paddingForLanes(laneCount);

  // Columns: 28 for cycles, 7 for reset (effectively).
  // But we render 28 columns always to keep grid alignment, and just fill 7 for reset.
  // Actually, reset rows only use first 7 cells.

  return (
    <div className="relative">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `56px repeat(28, minmax(32px, 1fr))`,
        }}
      >
        <div
          className="flex items-center justify-center border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 text-[10px] break-words p-1 text-center leading-tight"
        >
          {row.label}
        </div>

        {Array.from({ length: 28 }, (_, index) => {
          if (row.type === 'reset' && index >= row.days) {
            // Gray out or empty unused cells in reset week row
            return <div key={index} className="bg-slate-100 border-r border-gray-200/50" />;
          }

          const current = new Date(row.startDate);
          current.setDate(current.getDate() + index);

          const dayNum = current.getDate();
          const monthIdx = current.getMonth();
          const isCurrentMonth = true; // Always show valid date
          const weekday = current.getDay();
          const weekend = isWeekend(weekday);
          const isTodayDate = isToday(year, monthIdx, dayNum);

          return (
            <div
              key={index}
              className={clsx(
                'group relative flex min-h-[72px] flex-col gap-0 border-r border-gray-200 p-0 transition-colors hover:bg-gray-50',
                weekend ? 'bg-sky-50 hover:bg-sky-100' : 'bg-white',
                isTodayDate && 'outline outline-2 outline-amber-500 outline-offset-[-3px]',
              )}
              style={{ paddingBottom: cellPaddingBottom }}
            >
              <div className="p-0">
                <div
                  className={clsx(
                    'flex h-6 w-auto min-w-[24px] px-1 items-center justify-center rounded-full text-[10px] font-semibold transition-colors group-hover:bg-gray-100',
                    weekend ? 'text-sky-700 group-hover:bg-sky-100' : 'text-gray-700',
                  )}
                  title={current.toLocaleDateString()}
                >
                  {dayNum} <span className='text-[8px] text-gray-400 ml-0.5'>{monthLabels[monthIdx].slice(0, 3)}</span>
                </div>
              </div>
              {isTodayDate && (
                <div
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500"
                  aria-label="Today"
                />
              )}
            </div>
          );
        })}
      </div>

      {segments.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0 top-6 grid"
          style={{
            gridTemplateColumns: `56px repeat(28, minmax(32px, 1fr))`,
            gridAutoRows: '24px',
          }}
        >
          {segments.map((segment) => (
            <div
              key={`${segment.eventId}-${segment.lane}-${segment.xStart}`}
              className="pointer-events-auto"
              style={{
                gridColumn: `${segment.xStart + 2} / span ${segment.width}`,
                gridRowStart: segment.lane + 1,
              }}
              onClick={() => onSelectEvent && onSelectEvent(segment.source)}
            >
              <div
                className="flex h-5 items-center gap-1 truncate rounded-full px-2 text-[11px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: segment.color || '#0ea5e9' }}
              >
                <span className="truncate">{segment.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildSegments(
  events: CalendarEvent[],
  year: number,
  monthIndex: number,
  viewMode: ViewMode,
  weekStart: number,
  fixedColumns?: number,
  cycleRow?: CycleRow,
): EventSegment[] {
  let monthStart: Date;
  let monthEnd: Date;

  if (viewMode === 'cyclical' && cycleRow) {
    monthStart = cycleRow.startDate;
    monthEnd = cycleRow.endDate;
    // Set time to end of day for monthEnd
    monthEnd = new Date(monthEnd);
    monthEnd.setHours(23, 59, 59, 999);
  } else {
    monthStart = new Date(year, monthIndex, 1);
    monthEnd = new Date(year, monthIndex + 1, 0);
  }

  const segments: Array<{
    eventId: string;
    title: string;
    startDate: Date;
    endDate: Date;
    color?: string;
    source: CalendarEvent;
  }> = [];

  for (const evt of events) {
    if (!evt.start || !evt.end) continue;
    const isAllDay = evt.allDay || isAllDayLike(evt.start, evt.end);
    const start = toDate(evt.start, isAllDay);
    const end = toDate(evt.end, isAllDay, true);
    if (end < monthStart || start > monthEnd) continue;
    const startClamped = start > monthStart ? start : monthStart;
    const endClamped = end < monthEnd ? end : monthEnd;
    segments.push({
      eventId: evt.id,
      title: evt.title || '(No title)',
      startDate: startClamped,
      endDate: endClamped,
      color: evt.color,
      source: evt,
    });
  }

  const positioned: EventSegment[] = [];
  const lanes: number[] = [];

  const sorted = segments.sort((a, b) => {
    if (a.startDate.getTime() !== b.startDate.getTime()) {
      return a.startDate.getTime() - b.startDate.getTime();
    }
    const durationA = a.endDate.getTime() - a.startDate.getTime();
    const durationB = b.endDate.getTime() - b.startDate.getTime();
    if (durationA !== durationB) {
      return durationB - durationA; // within the same start day, longer events first
    }
    return a.endDate.getTime() - b.endDate.getTime();
  });

  for (const seg of sorted) {
    const { xStart, width } =
      viewMode === 'date-grid'
        ? positionDateGrid(seg, monthStart)
        : viewMode === 'cyclical'
          ? positionCyclical(seg, monthStart)
          : positionFixedWeek(seg, monthStart, weekStart, fixedColumns ?? 0);

    let laneIndex = 0;
    while (laneIndex < lanes.length && xStart <= lanes[laneIndex]) {
      laneIndex += 1;
    }
    if (laneIndex === lanes.length) {
      lanes.push(xStart + width - 1);
    } else {
      lanes[laneIndex] = xStart + width - 1;
    }

    positioned.push({
      eventId: seg.eventId,
      title: seg.title,
      xStart,
      width,
      lane: laneIndex,
      color: seg.color,
      source: seg.source,
    });
  }

  return positioned;
}

function positionDateGrid(
  seg: { startDate: Date; endDate: Date },
  monthStart: Date,
): { xStart: number; width: number } {
  const xStart = seg.startDate.getDate() - 1;
  const xEnd = seg.endDate.getDate() - 1;
  return { xStart, width: xEnd - xStart + 1 };
}

function positionFixedWeek(
  seg: { startDate: Date; endDate: Date },
  monthStart: Date,
  weekStart: number,
  columns: number,
): { xStart: number; width: number } {
  const offset = weekdayOffset(monthStart.getFullYear(), monthStart.getMonth(), weekStart);
  const xStart = offset + seg.startDate.getDate() - 1;
  const xEnd = offset + seg.endDate.getDate() - 1;
  const width = xEnd - xStart + 1;
  return { xStart, width };
}

function positionCyclical(
  seg: { startDate: Date; endDate: Date },
  rowStart: Date,
): { xStart: number; width: number } {
  // Calculate diff in days
  const diffTime = seg.startDate.getTime() - rowStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const widthTime = seg.endDate.getTime() - seg.startDate.getTime();
  // +1 because single day length is 1
  const widthDays = Math.floor(widthTime / (1000 * 60 * 60 * 24)) + 1;
  // Actually reusing existing width logic which seemed to be day diff + 1?
  // Let's verify DateGrid: xEnd - xStart + 1. 2nd - 1st = 1. width 2?
  // If Start Jan 1, End Jan 1. xStart=0. xEnd=0. Width=1. Correct.

  return { xStart: diffDays, width: widthDays };
}

function toDate(value: string, allDay?: boolean, isEnd?: boolean) {
  const d = new Date(value);
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Google all-day events are exclusive on end; subtract a day for end dates.
  if (allDay && isEnd) {
    base.setDate(base.getDate() - 1);
  }
  return base;
}

function isAllDayLike(startValue: string, endValue: string) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const isMidnight = (d: Date) =>
    d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
  const millisInDay = 24 * 60 * 60 * 1000;
  return isMidnight(start) && isMidnight(end) && Math.abs(end.getTime() - start.getTime()) % millisInDay === 0;
}
