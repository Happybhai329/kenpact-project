import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🩸</span>
          <span className="text-xl font-bold text-sky-500">Sweety</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-sky-500 font-medium transition-colors">Dashboard</Link>
          <Link to="/reports" className="text-gray-600 hover:text-sky-500 font-medium transition-colors">Reports</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hi, {user?.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
