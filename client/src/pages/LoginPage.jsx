import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'demo@sweety.com', password: 'demo1234' });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🩸</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Sweety</h1>
          <p className="text-gray-500 mt-1">Track your blood glucose levels</p>
        </div>

        {errors.api && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errors.api}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-sky-400`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-sky-400`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-sky-500 hover:underline font-medium"
          >
            Register
          </Link>
        </p>

        <div className="mt-4 p-3 bg-sky-50 rounded-lg text-xs text-sky-800 flex items-center justify-between gap-2">
          <span>
            Demo: <strong>demo@sweety.com</strong> / <strong>demo1234</strong>
          </span>
          <button
            type="button"
            onClick={fillDemo}
            className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-md font-medium shrink-0 transition-colors"
          >
            Fill Demo
          </button>
        </div>
      </div>
    </div>
  );
}
