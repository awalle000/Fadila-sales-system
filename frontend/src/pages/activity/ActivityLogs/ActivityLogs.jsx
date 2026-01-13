javascript name=frontend/src/pages/activity/ActivityLogs/ActivityLogs.jsx url=https://github.com/awalle000/Fadila-sales-system/blob/main/frontend/src/pages/activity/ActivityLogs/ActivityLogs.jsx
import { useState, useEffect } from 'react';
import { getActivityLogs, getLoginLogs } from '../../../services/salesService';
import { formatDateTime } from '../../../utils/formatDate';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'login' | 'invoices'
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25); // Show 25 logs per page

  // Load activity logs on mount (these include invoice-related activities)
  useEffect(() => {
    fetchActivityLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever activeTab changes, adjust filtered view & possibly fetch login logs
  useEffect(() => {
    if (activeTab === 'login' && loginLogs.length === 0) {
      fetchLoginLogs();
    } else {
      filterLogs();
    }
    // reset page & search when switching tabs
    setCurrentPage(1);
    setSearchTerm('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activityLogs, loginLogs]);

  // Re-filter when search term changes
  useEffect(() => {
    filterLogs();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs();
      setActivityLogs(data || []);
      // default filtered view for activity tab
      if (activeTab === 'activity') setFilteredLogs(data || []);
    } catch (error) {
      toast.error('Failed to load activity logs');
      setActivityLogs([]);
      setFilteredLogs([]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginLogs = async () => {
    setLoading(true);
    try {
      const data = await getLoginLogs();
      setLoginLogs(data || []);
      if (activeTab === 'login') setFilteredLogs(data || []);
    } catch (error) {
      toast.error('Failed to load login logs');
      setLoginLogs([]);
      setFilteredLogs([]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let logs = [];
    if (activeTab === 'activity') logs = activityLogs;
    else if (activeTab === 'login') logs = loginLogs;
    else if (activeTab === 'invoices') {
      // Invoice-related activity types start with "INVOICE"
      logs = activityLogs.filter(l => l.action && l.action.toUpperCase().startsWith('INVOICE'));
    }

    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }

    const q = searchTerm.toLowerCase();
    if (activeTab === 'activity' || activeTab === 'invoices') {
      const filtered = logs.filter(log =>
        (log.userName || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
      setFilteredLogs(filtered);
    } else {
      // login tab: search by user or IP
      const filtered = logs.filter(log =>
        (log.userName || '').toLowerCase().includes(q) ||
        (log.ipAddress || '').toLowerCase().includes(q)
      );
      setFilteredLogs(filtered);
    }
  };

  const getActionBadge = (action) => {
    if (!action) return <span className="action-badge secondary">📝 UNKNOWN</span>;

    const map = {
      LOGIN: { color: 'success', icon: '🔓', label: 'Login' },
      LOGOUT: { color: 'secondary', icon: '🔒', label: 'Logout' },

      // Sales
      SALE_RECORDED: { color: 'primary', icon: '💰', label: 'Sale Recorded' },

      // Product
      PRODUCT_CREATED: { color: 'success', icon: '➕', label: 'Product Created' },
      PRODUCT_UPDATED: { color: 'warning', icon: '✏️', label: 'Product Updated' },
      PRODUCT_DELETED: { color: 'danger', icon: '🗑️', label: 'Product Deleted' },

      // Stock
      STOCK_ADJUSTED: { color: 'info', icon: '📦', label: 'Stock Adjusted' },

      // Users
      USER_CREATED: { color: 'success', icon: '👤', label: 'User Created' },
      USER_UPDATED: { color: 'warning', icon: '✏️', label: 'User Updated' },
      USER_DELETED: { color: 'danger', icon: '🗑️', label: 'User Deleted' },
      USER_STATUS_CHANGED: { color: 'warning', icon: '🔄', label: 'User Status Changed' },

      // Invoice-related
      INVOICE_CREATED: { color: 'primary', icon: '🧾', label: 'Invoice Created' },
      INVOICE_PAYMENT: { color: 'success', icon: '💸', label: 'Invoice Payment' },
      INVOICE_UPDATED: { color: 'warning', icon: '✏️', label: 'Invoice Updated' },
      INVOICE_DELETED: { color: 'danger', icon: '🗑️', label: 'Invoice Deleted' },
      INVOICE_PRINT: { color: 'info', icon: '🖨️', label: 'Invoice Printed' }
    };

    const meta = map[action] || { color: 'secondary', icon: '📝', label: action.replace(/_/g, ' ') };
    return (
      <span className={`action-badge ${meta.color}`}>
        {meta.icon} {meta.label}
      </span>
    );
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

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

  // counts for tabs
  const invoiceCount = activityLogs.filter(l => l.action && l.action.toUpperCase().startsWith('INVOICE')).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🔍 Activity Logs</h1>
        <p className="page-subtitle">Monitor all system activities, invoices, and user logins</p>
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
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('invoices');
            setSearchTerm('');
          }}
        >
          🧾 Invoice Activity ({invoiceCount})
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
              : activeTab === 'invoices'
              ? "🔍 Search invoice activities by user, action, or details..."
              : "🔍 Search by user or IP..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Showing results info */}
      {filteredLogs.length > 0 && (
        <div className="results-info">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} logs
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="logs-container">
          {(activeTab === 'activity' || activeTab === 'invoices') ? (
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
                        {searchTerm ? `No ${activeTab === 'invoices' ? 'invoice ' : ''}logs found matching "${searchTerm}"` : `No ${activeTab === 'invoices' ? 'invoice ' : ''}logs found`}
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

          {/* Pagination Controls */}
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