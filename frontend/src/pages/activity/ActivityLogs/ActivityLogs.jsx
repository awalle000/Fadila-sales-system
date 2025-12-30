import { useState, useEffect } from 'react';
import { getActivityLogs, getLoginLogs } from '../../../services/salesService';
import { formatDateTime } from '../../../utils/formatDate';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  useEffect(() => {
    filterLogs();
  }, [activityLogs, loginLogs, searchTerm, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'activity') {
        const data = await getActivityLogs();
        setActivityLogs(data);
      } else {
        const data = await getLoginLogs();
        setLoginLogs(data);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    const logs = activeTab === 'activity' ? activityLogs : loginLogs;
    
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }

    const filtered = logs.filter(log =>
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredLogs(filtered);
  };

  const getActionBadge = (action) => {
    const badges = {
      LOGIN: { color: 'success', icon: '🔓' },
      LOGOUT: { color: 'secondary', icon: '🔒' },
      SALE_RECORDED: { color: 'primary', icon: '💰' },
      PRODUCT_CREATED: { color: 'success', icon: '➕' },
      PRODUCT_UPDATED: { color: 'warning', icon: '✏️' },
      PRODUCT_DELETED: { color: 'danger', icon: '🗑️' },
      STOCK_ADJUSTED: { color: 'info', icon: '📦' },
      USER_CREATED: { color: 'success', icon: '👤' },
      USER_UPDATED: { color: 'warning', icon: '✏️' },
      USER_DELETED: { color: 'danger', icon: '🗑️' },
      USER_STATUS_CHANGED: { color: 'warning', icon: '🔄' }
    };

    const badge = badges[action] || { color: 'secondary', icon: '📝' };
    return (
      <span className={`action-badge ${badge.color}`}>
        {badge.icon} {action.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🔍 Activity Logs</h1>
        <p className="page-subtitle">Monitor all system activities and user logins</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📝 Activity Logs ({activityLogs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          🔐 Login History ({loginLogs.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Search logs by user, action, or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="logs-container">
          {activeTab === 'activity' ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="date-cell">{formatDateTime(log.createdAt)}</td>
                        <td className="user-cell">{log.userName}</td>
                        <td>{getActionBadge(log.action)}</td>
                        <td className="details-cell">{log.details || '-'}</td>
                        <td className="ip-cell">{log.ipAddress || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">No activity logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Login Time</th>
                    <th>User</th>
                    <th>Logout Time</th>
                    <th>Session Duration</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const loginTime = new Date(log.loginTime);
                      const logoutTime = log.logoutTime ? new Date(log.logoutTime) : null;
                      const duration = logoutTime 
                        ? Math.round((logoutTime - loginTime) / 1000 / 60) 
                        : null;

                      return (
                        <tr key={log._id}>
                          <td className="date-cell">{formatDateTime(log.loginTime)}</td>
                          <td className="user-cell">{log.userName}</td>
                          <td className="date-cell">
                            {log.logoutTime ? formatDateTime(log.logoutTime) : (
                              <span className="active-session">Active</span>
                            )}
                          </td>
                          <td>
                            {duration ? `${duration} minutes` : '-'}
                          </td>
                          <td className="ip-cell">{log.ipAddress || '-'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">No login logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;