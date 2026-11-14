import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiInsightsCard from '../src/components/AiInsightsCard';
import api from '../src/api/axios';

vi.mock('../src/api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AiInsightsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial AI card with generate button and model badge', () => {
    render(<AiInsightsCard reportType="daily" date="2026-11-14" />);

    expect(screen.getByText('AI Clinical Insights')).toBeInTheDocument();
    expect(screen.getByText('Gemini 2.5 Flash')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generate ai insights/i })
    ).toBeInTheDocument();
  });

  it('fetches insights and displays status, summary, and patterns on click', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          status: 'Optimal Control',
          statusColor: 'green',
          summary: 'Patient demonstrates solid glycemic stability within target range.',
          patterns: ['Fasting levels are consistently between 85-95 mg/dl'],
          recommendations: ['Maintain current dietary habits'],
          doctorQuestions: ['Discuss current HbA1c trajectory'],
          timeInRangePercent: 94,
          disclaimer: 'For informational purposes only.',
        },
      },
    });

    render(<AiInsightsCard reportType="daily" date="2026-11-14" />);

    await user.click(
      screen.getByRole('button', { name: /generate ai insights/i })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/ai/insights?type=daily&date=2026-11-14');
      expect(screen.getByText('Optimal Control')).toBeInTheDocument();
      expect(
        screen.getByText('Patient demonstrates solid glycemic stability within target range.')
      ).toBeInTheDocument();
      expect(screen.getByText(/Time in Range: 94%/i)).toBeInTheDocument();
      expect(
        screen.getByText('Fasting levels are consistently between 85-95 mg/dl')
      ).toBeInTheDocument();
    });
  });
});
