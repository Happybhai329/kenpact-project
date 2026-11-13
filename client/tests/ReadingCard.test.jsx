import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingCard from '../src/components/ReadingCard';

const mockSlotLabels = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

describe('ReadingCard', () => {
  const sampleReading = {
    id: 101,
    date: '2026-11-13T00:00:00.000Z',
    slot: 'morning_fasting',
    value: 95,
  };

  it('renders reading value, slot label, badge and date', () => {
    render(
      <ReadingCard
        reading={sampleReading}
        slotLabels={mockSlotLabels}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Morning (fasting)')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('shows low badge when glucose < 70', () => {
    const lowReading = { ...sampleReading, value: 65 };
    render(
      <ReadingCard
        reading={lowReading}
        slotLabels={mockSlotLabels}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('shows elevated badge when glucose is 141-200', () => {
    const elevatedReading = { ...sampleReading, value: 165 };
    render(
      <ReadingCard
        reading={elevatedReading}
        slotLabels={mockSlotLabels}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Elevated')).toBeInTheDocument();
  });

  it('shows high badge when glucose > 200', () => {
    const highReading = { ...sampleReading, value: 240 };
    render(
      <ReadingCard
        reading={highReading}
        slotLabels={mockSlotLabels}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ReadingCard
        reading={sampleReading}
        slotLabels={mockSlotLabels}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(sampleReading);
  });

  it('requires confirmation before deleting and calls onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ReadingCard
        reading={sampleReading}
        slotLabels={mockSlotLabels}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    // Initial state: only Delete button
    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteBtn);

    // Confirmation state: Confirm and Cancel buttons
    expect(screen.getByText(/delete\?/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });

    // Click confirm
    await user.click(confirmBtn);
    expect(onDelete).toHaveBeenCalledWith(101);
  });

  it('cancels deletion when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ReadingCard
        reading={sampleReading}
        slotLabels={mockSlotLabels}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });
});
