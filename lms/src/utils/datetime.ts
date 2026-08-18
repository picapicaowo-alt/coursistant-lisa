import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * Formats a deadline for display.
 *
 * The API hands back wall-clock time in the *tenant's* zone with no offset
 * attached, so the string alone is ambiguous — it has to be re-anchored in
 * that zone before it means an instant. INV-06 then requires showing it in the
 * viewer's own zone with a timezone label, so that every screen refers to the
 * same moment and nobody misreads a deadline by the offset between them.
 *
 * The label is deliberately concentrated here. The Figma date picker and
 * schedule modal show no timezone at all, which contradicts INV-06 — that is
 * open-decisions.md B-8, still undecided. When it is settled, this function is
 * the only place that has to change.
 *
 * @param atLocal wall-clock time in `tenantZone`, e.g. "2026-08-01T00:26:01"
 * @param tenantZone IANA zone the value is expressed in
 */
export const formatDeadline = (atLocal: string, tenantZone: string): string => {
  const instant = dayjs.tz(atLocal, tenantZone);

  if (!instant.isValid()) {
    // Better to surface the raw value than to render a plausible wrong time.
    return atLocal;
  }

  return instant.local().format('MMM D, HH:mm ') + localZoneLabel();
};

/**
 * Short label for the viewer's zone, e.g. "PDT". Falls back to the IANA name
 * when the runtime cannot produce an abbreviation.
 */
const localZoneLabel = (): string => {
  const parts = new Intl.DateTimeFormat('en-US', {timeZoneName: 'short'})
    .formatToParts(new Date());
  return parts.find((part) => part.type === 'timeZoneName')?.value
    ?? dayjs.tz.guess();
};

/**
 * Whether a deadline expressed in `tenantZone` has already passed.
 * Compares instants, so the viewer's zone does not affect the answer.
 */
export const isPastDeadline = (atLocal: string, tenantZone: string): boolean => {
  const instant = dayjs.tz(atLocal, tenantZone);
  return instant.isValid() && instant.isBefore(dayjs());
};
