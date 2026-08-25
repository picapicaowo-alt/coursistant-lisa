const COURSE_LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const isLeapYear = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const daysInMonth = (year: number, month: number) => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/**
 * Validates an Assignment API wall-clock value without interpreting it as an
 * instant. Accepted minute-precision values are normalized to whole seconds.
 */
export const normalizeCourseLocalDateTime = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const match = value.match(COURSE_LOCAL_DATE_TIME_PATTERN);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '00'] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    month < 1
    || month > 12
    || day < 1
    || day > daysInMonth(year, month)
    || hour > 23
    || minute > 59
    || second > 59
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`;
};

/** Converts a validated course-local API value to the editor's minute precision. */
export const toCourseLocalDateTimeInput = (value?: string): string =>
  value && normalizeCourseLocalDateTime(value) ? value.slice(0, 16) : '';
