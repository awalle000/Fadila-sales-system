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
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25); // Show 25 logs per page

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  useEffect(() => {
    filterLogs();
    setCurrentPage(1); // Reset to first page when filters change
  }, [activityLogs, loginLogs, searchTerm, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'activity') {
        const data = await getActivityLogs();
        setActivityLogs(data || []);
      } else {
        const data = await getLoginLogs();
        setLoginLogs(data || []);
      }
    } catch (error) {
      toast.error('Failed to load logs');
      if (activeTab === 'activity') {
        setActivityLogs([]);
      } else {
        setLoginLogs([]);
      }
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

    if (activeTab === 'activity') {
      const filtered = logs.filter(log =>
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      const filtered = logs.filter(log =>
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  };

  const getActionBadge = (action) => {
    if (!action) return <span className="action-badge secondary">📝 UNKNOWN</span>;

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

  // ✅ Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // ✅ Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1);
  };

  // ✅ Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
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
          onClick={() => {
            setActiveTab('activity');
            setSearchTerm('');
          }}
        >
          📝 Activity Logs ({activityLogs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('login');
            setSearchTerm('');
          }}
        >
          🔐 Login History ({loginLogs.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder={
            activeTab === 'activity' 
              ? "🔍 Search by user, action, or details..." 
              : "🔍 Search by user..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* ✅ Showing results info */}
      {filteredLogs.length > 0 && (
        <div className="results-info">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} logs
        </div>
      )}

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
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log) => (
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
                      <td colSpan="5" className="no-data">
                        {searchTerm ? `No activity logs found matching "${searchTerm}"` : 'No activity logs found'}
                      </td>
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
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log) => {
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
                              <span className="active-session">🟢 Active</span>
                            )}
                          </td>
                          <td>
                            {duration ? `${duration} min` : '-'}
                          </td>
                          <td className="ip-cell">{log.ipAddress || '-'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? `No login logs found matching "${searchTerm}"` : 'No login logs found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ✅ Pagination Controls */}
          {filteredLogs.length > itemsPerPage && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="pagination-numbers">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                className="pagination-btn"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;