import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../../utils/formatDate';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-brand">🧼 Fadila Enterprise</h1>
        <div className="navbar-time">
          {formatDateTime(new Date())}
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role?.toUpperCase()}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;