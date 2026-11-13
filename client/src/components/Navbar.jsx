import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🩸</span>
          <span className="text-xl font-bold text-sky-500 tracking-tight">Sweety</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            to="/"
            className={`font-medium text-sm transition-colors px-2 py-1 rounded-md ${
              isActive('/')
                ? 'text-sky-600 font-semibold bg-sky-50'
                : 'text-gray-600 hover:text-sky-500'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/reports"
            className={`font-medium text-sm transition-colors px-2 py-1 rounded-md ${
              isActive('/reports')
                ? 'text-sky-600 font-semibold bg-sky-50'
                : 'text-gray-600 hover:text-sky-500'
            }`}
          >
            Reports
          </Link>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              👤 {user?.name?.split(' ')[0] || 'Patient'}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((p) => !p)}
          className="sm:hidden p-2 text-gray-600 hover:text-sky-500 rounded-lg hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/')
                ? 'bg-sky-50 text-sky-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/reports')
                ? 'bg-sky-50 text-sky-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Reports
          </Link>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Signed in as <strong>{user?.name?.split(' ')[0]}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
