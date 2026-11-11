import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from '../src/components/ReadingForm';
import api from '../src/api/axios';
import { getLocalTodayString } from '../src/utils/date';

vi.mock('../src/api/axios', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ReadingForm', () => {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error when glucose value is empty', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSuccess={onSuccess} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /add reading/i }));

    expect(
      screen.getByText('Please enter a glucose value.')
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows validation error when glucose value is outside 40–600 mg/dl', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSuccess={onSuccess} onCancel={onCancel} />);

    const valueInput = screen.getByLabelText(/value \(mg\/dl\)/i);
    await user.type(valueInput, '30');
    await user.click(screen.getByRole('button', { name: /add reading/i }));

    expect(
      screen.getByText('Value must be between 40 and 600 mg/dl.')
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows validation error when date is in the future', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSuccess={onSuccess} onCancel={onCancel} />);

    const dateInput = screen.getByLabelText(/date/i);
    const valueInput = screen.getByLabelText(/value \(mg\/dl\)/i);

    await user.clear(dateInput);
    await user.type(dateInput, '2099-01-01');
    await user.type(valueInput, '110');
    await user.click(screen.getByRole('button', { name: /add reading/i }));

    expect(
      screen.getByText('Date cannot be in the future.')
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits valid reading and calls onSuccess', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { status: 'success' } });
    render(<ReadingForm onSuccess={onSuccess} onCancel={onCancel} />);

    await user.selectOptions(
      screen.getByLabelText(/time slot/i),
      'after_lunch'
    );
    await user.type(screen.getByLabelText(/value \(mg\/dl\)/i), '142');
    await user.click(screen.getByRole('button', { name: /add reading/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/readings', {
        date: getLocalTodayString(),
        slot: 'after_lunch',
        value: 142,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('displays server error message when slot is already taken', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'You already have an After lunch reading for this date.',
        },
      },
    });
    render(<ReadingForm onSuccess={onSuccess} onCancel={onCancel} />);

    await user.selectOptions(
      screen.getByLabelText(/time slot/i),
      'after_lunch'
    );
    await user.type(screen.getByLabelText(/value \(mg\/dl\)/i), '142');
    await user.click(screen.getByRole('button', { name: /add reading/i }));

    expect(
      await screen.findByText(
        'You already have an After lunch reading for this date.'
      )
    ).toBeInTheDocument();
  });
});
