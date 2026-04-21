import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">💪 FitnessTracker</Link>

      {user ? (
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>📊 Дашборд</Link>
          <Link to="/weight" className={`nav-link ${isActive('/weight')}`}>⚖️ Вага</Link>
          <span style={{color: '#475569', margin: '0 8px'}}>|</span>
          <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>👤 {user.username}</Link>
          <button onClick={handleLogout} className="btn-logout">Вийти</button>
        </div>
      ) : (
        <div className="navbar-links">
          <Link to="/login" className="nav-link">Вхід</Link>
          <Link to="/register" className="nav-link active">Реєстрація</Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;