export type ViewMode = 'date-grid' | 'fixed-week' | 'cyclical';

export const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

export const weekdayOffset = (year: number, monthIndex: number, weekStart: number) => {
  const day = new Date(year, monthIndex, 1).getDay();
  return (day - weekStart + 7) % 7;
};

export const isWeekend = (weekday: number) => weekday === 0 || weekday === 6;

export const isToday = (year: number, monthIndex: number, day: number) => {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === monthIndex &&
    today.getDate() === day
  );
};

export const toDateOnly = (value: string) => {
  const d = new Date(value);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

export type CycleRow = {
  type: 'cycle' | 'reset';
  label: string;
  startDate: Date;
  endDate: Date;
  days: number;
};

const getISOYearStart = (year: number) => {
  // ISO 8601: First week is the one with at least 4 days of the new year.
  // Equiv: Week containing Jan 4th.
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay(); // 0=Sun, 1=Mon...
  // Monday of that week.
  // JS Day: 0=Sun, 6=Sat.
  // Correct offset: Mon=0, Tue=1.. Sun=6 -> (day + 6) % 7.
  const monOffset = (day + 6) % 7;
  const start = new Date(jan4);
  start.setDate(jan4.getDate() - monOffset);
  return start;
};

export const getQuarterStructure = (year: number): CycleRow[] => {
  const rows: CycleRow[] = [];
  const startOfYear = getISOYearStart(year);
  const startOfNextYear = getISOYearStart(year + 1);

  const currentDate = new Date(startOfYear);

  for (let q = 1; q <= 4; q++) {
    // 3 Cycles of 28 days
    for (let c = 1; c <= 3; c++) {
      const cycleNum = (q - 1) * 3 + c;
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 27); // 28 days inclusive

      rows.push({
        type: 'cycle',
        label: `Cycle ${cycleNum}`,
        startDate: start,
        endDate: end,
        days: 28,
      });

      // Advance
      currentDate.setDate(currentDate.getDate() + 28);
    }

    // 1 Reset Week
    const isLast = q === 4;
    const start = new Date(currentDate);

    let daysInReset = 7;

    if (isLast) {
      // Calculate days remaining until next year's start
      const diffTime = startOfNextYear.getTime() - start.getTime();
      daysInReset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Safety check just in case logic fails or negative (shouldn't happen with correct ISO logic)
    if (daysInReset < 1) daysInReset = 7;

    const end = new Date(start);
    end.setDate(end.getDate() + daysInReset - 1);

    rows.push({
      type: 'reset',
      label: isLast ? 'Reset / End' : 'Reset Week',
      startDate: start,
      endDate: end,
      days: daysInReset,
    });

    currentDate.setDate(currentDate.getDate() + daysInReset);
  }

  return rows;
};
