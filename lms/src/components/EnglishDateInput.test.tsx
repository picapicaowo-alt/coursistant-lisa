import {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {EnglishDateInput, EnglishDateTimeInput, EnglishTimeInput} from './EnglishDateInput';

describe('English date inputs', () => {
  it('shows and emits datetime values in a fixed English format', () => {
    const Harness = () => {
      const [value, setValue] = useState('2026-08-03T22:19');
      return <><label>Due time<EnglishDateTimeInput value={value} onChangeValue={setValue}/></label><output>{value}</output></>;
    };
    render(<Harness/>);

    const input = screen.getByLabelText('Due time') as HTMLInputElement;
    expect(input.value).toBe('08/03/2026, 10:19 PM');
    fireEvent.change(input, {target: {value: '09/15/2026, 11:45 PM'}});

    expect(screen.getByText('2026-09-15T23:45').textContent).toBe('2026-09-15T23:45');
    expect(input.lang).toBe('en-US');
    expect(input.type).toBe('text');
  });

  it('normalizes date and time values without the browser locale', () => {
    const dateChange = vi.fn();
    const timeChange = vi.fn();
    render(
      <>
        <label>Start date<EnglishDateInput value="" onChangeValue={dateChange}/></label>
        <label>Start time<EnglishTimeInput value="" onChangeValue={timeChange}/></label>
      </>,
    );

    fireEvent.change(screen.getByLabelText('Start date'), {target: {value: '02/28/2027'}});
    fireEvent.change(screen.getByLabelText('Start time'), {target: {value: '12:05 AM'}});

    expect(dateChange).toHaveBeenLastCalledWith('2027-02-28');
    expect(timeChange).toHaveBeenLastCalledWith('00:05');
    expect((screen.getByLabelText('Start date') as HTMLInputElement).placeholder).toBe('MM/DD/YYYY');
  });
});
