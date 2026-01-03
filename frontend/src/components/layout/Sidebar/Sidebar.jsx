import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // ✅ Close sidebar when route changes (mobile)
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // ✅ Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ✅ Close sidebar when clicking overlay
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* ✅ Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
              onClick={handleLinkClick}
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

      {/* ✅ Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ✅ Mobile Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar menu"
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </>
  );
};

export default Sidebar;