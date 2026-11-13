import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../src/components/Navbar';
import { AuthProvider } from '../src/context/AuthContext';

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, name: 'Happy Bhasin', email: 'happy@example.com' })
    );
    localStorage.setItem('token', 'test-token');
  });

  const renderNavbar = (initialEntry = '/') => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Navbar />
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('renders branding and navigation links', () => {
    renderNavbar();

    expect(screen.getByText('Sweety')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
    expect(screen.getByText(/👤 Happy/i)).toBeInTheDocument();
  });

  it('clears session on logout button click', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
    await user.click(logoutButtons[0]);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('toggles mobile menu on mobile button click', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggleBtn = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(toggleBtn).toBeInTheDocument();

    // Open mobile menu
    await user.click(toggleBtn);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();

    // Close mobile menu
    await user.click(toggleBtn);
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
  });
});
