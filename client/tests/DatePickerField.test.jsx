import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePickerField from '../src/components/DatePickerField';
import { getLocalTodayString, shiftDays } from '../src/utils/date';

describe('DatePickerField', () => {
  it('renders input with current value, steppers, and quick presets', () => {
    const todayStr = getLocalTodayString();
    render(
      <DatePickerField
        id="test-date"
        label="Select Date"
        value={todayStr}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous day/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next day/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^today$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^yesterday$/i })).toBeInTheDocument();
  });

  it('steps day backward when previous button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const todayStr = getLocalTodayString();

    render(
      <DatePickerField
        id="test-date"
        label="Select Date"
        value={todayStr}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /previous day/i }));
    expect(onChange).toHaveBeenCalledWith(shiftDays(todayStr, -1));
  });

  it('selects yesterday when quick preset is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const todayStr = getLocalTodayString();

    render(
      <DatePickerField
        id="test-date"
        label="Select Date"
        value={todayStr}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /^yesterday$/i }));
    expect(onChange).toHaveBeenCalledWith(shiftDays(todayStr, -1));
  });

  it('opens interactive calendar and selects a day', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DatePickerField
        id="test-date"
        label="Select Date"
        value="2026-11-15"
        max="2026-11-15"
        onChange={onChange}
      />
    );

    // Click calendar toggle button
    await user.click(screen.getByRole('button', { name: /toggle interactive calendar picker/i }));

    // November 2026 should be visible
    expect(screen.getByText(/november 2026/i)).toBeInTheDocument();

    // Click on day 10
    const day10Btn = screen.getByRole('button', { name: '10' });
    await user.click(day10Btn);

    expect(onChange).toHaveBeenCalledWith('2026-11-10');
  });
});
