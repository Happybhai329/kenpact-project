import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import api from '../src/api/axios';
import { AuthProvider } from '../src/context/AuthContext';

vi.mock('../src/api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn().mockResolvedValue({ data: { status: 'ok' } }),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderLoginPage = () => {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form elements and Fill Demo button', () => {
    renderLoginPage();

    expect(screen.getByText('Welcome to Sweety')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fill demo/i })).toBeInTheDocument();
  });

  it('shows client-side validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('fills demo credentials when clicking Fill Demo button', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /fill demo/i }));

    expect(screen.getByLabelText(/email/i)).toHaveValue('demo@sweety.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('demo1234');
  });

  it('submits valid credentials and calls login API', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          user: { id: 1, name: 'Demo Patient', email: 'demo@sweety.com' },
          token: 'mock-jwt-token',
        },
      },
    });

    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /fill demo/i }));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'demo@sweety.com',
        password: 'demo1234',
      });
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });
  });

  it('displays API error message on login failure', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid email or password' },
      },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});
