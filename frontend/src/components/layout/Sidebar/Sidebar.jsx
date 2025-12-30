import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'ceo';

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: isCEO ? '/ceo-dashboard' : '/manager-dashboard',
      roles: ['ceo', 'manager']
    },
    {
      title: 'Products',
      icon: '📦',
      path: '/products',
      roles: ['ceo', 'manager']
    },
    {
      title: 'New Sale',
      icon: '💰',
      path: '/sales/new',
      roles: ['ceo', 'manager']
    },
    {
      title: 'Sales History',
      icon: '📝',
      path: '/sales/history',
      roles: ['ceo', 'manager']
    },
    {
      title: 'Stock Overview',
      icon: '📋',
      path: '/inventory',
      roles: ['ceo', 'manager']
    },
    {
      title: 'Daily Report',
      icon: '📅',
      path: '/reports/daily',
      roles: ['ceo', 'manager']
    },
    {
      title: 'Monthly Report',
      icon: '📆',
      path: '/reports/monthly',
      roles: ['ceo', 'manager']
    },
    {
      title: 'Profit/Loss',
      icon: '💹',
      path: '/reports/profit-loss',
      roles: ['ceo']
    },
    {
      title: 'Activity Logs',
      icon: '🔍',
      path: '/activity-logs',
      roles: ['ceo']
    },
    {
      title: 'User Management',
      icon: '👥',
      path: '/users',
      roles: ['ceo']
    }
  ];

  const visibleMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Menu</h2>
        <div className="sidebar-role-badge">
          {user?.role?.toUpperCase()}
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleMenuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-text">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;