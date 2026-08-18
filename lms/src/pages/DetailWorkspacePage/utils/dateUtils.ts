export function convertToDate(dateValue: Date | string): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  return new Date(dateValue);
}

export function convertToISODateString(dateValue: Date | string): string {
  return convertToDate(dateValue).toISOString();
}

export function formatDateForDisplay(dateValue: Date | string): string {
  return convertToDate(dateValue).toLocaleString('en-US');
}

export function isValidDate(dateValue: unknown): dateValue is Date | string {
  if (dateValue instanceof Date) return true;
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  }
  return false;
}
