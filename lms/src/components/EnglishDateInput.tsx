import {useEffect, useRef, useState} from 'react';
import type {InputHTMLAttributes} from 'react';

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChangeValue: (value: string) => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

const parseDate = (displayValue: string): string | null => {
  const trimmedValue = displayValue.trim();
  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return parseDate(`${month}/${day}/${year}`);
  }

  const match = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
};

const formatDate = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : '';
};

const parseTime = (displayValue: string): string | null => {
  const trimmedValue = displayValue.trim();
  const twentyFourHourMatch = trimmedValue.match(/^(\d{2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    return hour <= 23 && minute <= 59 ? `${pad(hour)}:${pad(minute)}` : null;
  }

  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour12 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return null;
  const period = match[3].toUpperCase();
  const hour24 = hour12 % 12 + (period === 'PM' ? 12 : 0);
  return `${pad(hour24)}:${pad(minute)}`;
};

const formatTime = (value: string): string => {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return '';
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 > 23 || minute > 59) return '';
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${pad(hour12)}:${pad(minute)} ${period}`;
};

const formatDateTime = (dateTimeValue: string) => {
  const [date, time] = dateTimeValue.split('T');
  const formattedDate = formatDate(date ?? '');
  const formattedTime = formatTime(time ?? '');
  return formattedDate && formattedTime ? `${formattedDate}, ${formattedTime}` : '';
};

const parseDateTime = (displayValue: string) => {
  const trimmedValue = displayValue.trim();
  const isoMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  if (isoMatch) {
    const date = parseDate(isoMatch[1]);
    const time = parseTime(isoMatch[2]);
    return date && time ? `${date}T${time}` : null;
  }

  const match = trimmedValue.match(/^(.+?),\s*(.+)$/);
  if (!match) return null;
  const date = parseDate(match[1]);
  const time = parseTime(match[2]);
  return date && time ? `${date}T${time}` : null;
};

const useEnglishInput = (
  value: string,
  format: (value: string) => string,
  parse: (displayValue: string) => string | null,
  onChangeValue: (value: string) => void,
) => {
  const [displayValue, setDisplayValue] = useState(() => format(value));
  const lastEmittedValue = useRef(value);

  useEffect(() => {
    if (value === lastEmittedValue.current) return;
    lastEmittedValue.current = value;
    setDisplayValue(format(value));
  }, [format, value]);

  const onChange = (nextDisplayValue: string) => {
    const parsedValue = parse(nextDisplayValue);
    const nextValue = nextDisplayValue.trim() === '' ? '' : (parsedValue ?? '');
    setDisplayValue(parsedValue ? format(parsedValue) : nextDisplayValue);
    lastEmittedValue.current = nextValue;
    onChangeValue(nextValue);
  };

  return {displayValue, onChange};
};

const commonProps = {
  autoComplete: 'off',
  inputMode: 'numeric' as const,
  lang: 'en-US',
};

export const EnglishDateInput = ({value, onChangeValue, ...props}: BaseProps) => {
  const input = useEnglishInput(value, formatDate, parseDate, onChangeValue);
  return (
    <input
      {...props}
      {...commonProps}
      type="text"
      value={input.displayValue}
      placeholder={props.placeholder ?? 'MM/DD/YYYY'}
      pattern="\d{1,2}/\d{1,2}/\d{4}"
      title="Use MM/DD/YYYY"
      onInput={event => event.currentTarget.setCustomValidity('')}
      onInvalid={event => event.currentTarget.setCustomValidity('Use MM/DD/YYYY.')}
      onChange={event => input.onChange(event.target.value)}
    />
  );
};

export const EnglishTimeInput = ({value, onChangeValue, ...props}: BaseProps) => {
  const input = useEnglishInput(value, formatTime, parseTime, onChangeValue);
  return (
    <input
      {...props}
      {...commonProps}
      type="text"
      value={input.displayValue}
      placeholder={props.placeholder ?? 'hh:mm AM/PM'}
      pattern="\d{1,2}:\d{2}\s*(AM|PM|am|pm)"
      title="Use hh:mm AM/PM"
      onInput={event => event.currentTarget.setCustomValidity('')}
      onInvalid={event => event.currentTarget.setCustomValidity('Use hh:mm AM/PM.')}
      onChange={event => input.onChange(event.target.value)}
    />
  );
};

export const EnglishDateTimeInput = ({value, onChangeValue, ...props}: BaseProps) => {
  const input = useEnglishInput(value, formatDateTime, parseDateTime, onChangeValue);

  return (
    <input
      {...props}
      {...commonProps}
      type="text"
      value={input.displayValue}
      placeholder={props.placeholder ?? 'MM/DD/YYYY, hh:mm AM/PM'}
      pattern="\d{1,2}/\d{1,2}/\d{4},\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)"
      title="Use MM/DD/YYYY, hh:mm AM/PM"
      onInput={event => event.currentTarget.setCustomValidity('')}
      onInvalid={event => event.currentTarget.setCustomValidity('Use MM/DD/YYYY, hh:mm AM/PM.')}
      onChange={event => input.onChange(event.target.value)}
    />
  );
};
