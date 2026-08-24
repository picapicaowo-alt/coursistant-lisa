import {durationLabel} from '@/utils/dateTimeRange';

interface DurationSelectProps {
  minutes: number | null;
  options: readonly number[];
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

export const DurationSelect = ({minutes, options, onChange, disabled = false}: DurationSelectProps) => (
  <label>
    <span>Duration</span>
    <select
      aria-label="Duration"
      disabled={disabled}
      value={minutes === null ? 'custom' : String(minutes)}
      onChange={event => {
        if (event.target.value !== 'custom') onChange(Number(event.target.value));
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>{durationLabel(option)}</option>
      ))}
      {minutes === null ? <option value="custom">{disabled ? 'Set start first' : 'Custom'}</option> : null}
    </select>
  </label>
);
