import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../src/pages/RegisterPage';
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

const renderRegisterPage = () => {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form elements', () => {
    renderRegisterPage();

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('validates password length minimum of 6 characters', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), '12345');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('successfully registers and sets user in auth state', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          user: { id: 2, name: 'Alice Smith', email: 'alice@example.com' },
          token: 'token-alice',
        },
      },
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Alice Smith');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'secret123',
      });
      expect(localStorage.getItem('token')).toBe('token-alice');
    });
  });

  it('displays API error when email already exists', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Email already registered' },
      },
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Duplicate');
    await user.type(screen.getByLabelText(/email/i), 'dup@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });
});
