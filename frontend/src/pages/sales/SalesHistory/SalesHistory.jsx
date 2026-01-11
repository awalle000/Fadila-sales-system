import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getAllSales, getMySales } from '../../../services/salesService';
import { formatDateTime } from '../../../utils/formatDate';
import { formatCedis } from '../../../utils/calculateProfit';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './SalesHistory.css';

const SalesHistory = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 sales per page
  
  const isCEO = user?.role === 'ceo';

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
    setCurrentPage(1); // Reset to first page when filters change
  }, [sales, searchTerm, dateFilter]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = isCEO ? await getAllSales() : await getMySales();
      setSales(data);
    } catch (error) {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(sale => new Date(sale.saleDate) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(sale => new Date(sale.saleDate) >= monthAgo);
    }

    setFilteredSales(filtered);
  };

  const calculateTotals = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalItems = filteredSales.reduce((sum, sale) => sum + sale.quantitySold, 0);

    return { totalRevenue, totalProfit, totalItems };
  };

  // ✅ Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

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

  // ✅ Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const totals = calculateTotals();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Sales History</h1>
          <p className="page-subtitle">
            {isCEO ? 'All sales transactions' : 'Your sales transactions'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Total Revenue</h3>
            <div className="summary-value">{formatCedis(totals.totalRevenue)}</div>
          </div>
        </div>
        {/* ✅ Only show profit card to CEO */}
        {isCEO && (
          <div className="summary-card">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <h3>Total Profit</h3>
              <div className="summary-value profit">{formatCedis(totals.totalProfit)}</div>
            </div>
          </div>
        )}
        <div className="summary-card">
          <div className="summary-icon">📦</div>
          <div className="summary-content">
            <h3>Items Sold</h3>
            <div className="summary-value">{totals.totalItems}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🧾</div>
          <div className="summary-content">
            <h3>Transactions</h3>
            <div className="summary-value">{filteredSales.length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by product or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="date-filters">
          <button
            className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDateFilter('all')}
          >
            All Time
          </button>
          <button
            className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
            onClick={() => setDateFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
            onClick={() => setDateFilter('week')}
          >
            Last 7 Days
          </button>
          <button
            className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
            onClick={() => setDateFilter('month')}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* ✅ Showing results info */}
      {filteredSales.length > 0 && (
        <div className="results-info">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSales.length)} of {filteredSales.length} sales
        </div>
      )}

      {/* Sales Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Amount</th>
              {/* ✅ Only show profit column to CEO */}
              {isCEO && <th>Profit</th>}
              {isCEO && <th>Sold By</th>}
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {currentSales.length > 0 ? (
              currentSales.map((sale) => (
                <tr key={sale._id}>
                  <td className="date-cell">{formatDateTime(sale.saleDate)}</td>
                  <td className="product-name">{sale.productName}</td>
                  <td>{sale.quantitySold}</td>
                  <td>{formatCedis(sale.unitPrice)}</td>
                  <td className="revenue">{formatCedis(sale.totalAmount)}</td>
                  {/* ✅ Only show profit cell to CEO */}
                  {isCEO && <td className="profit">{formatCedis(sale.profit)}</td>}
                  {isCEO && <td>{sale.sellerName}</td>}
                  <td className="notes-cell">{sale.notes || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isCEO ? "8" : "6"} className="no-data">
                  No sales found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Controls */}
      {filteredSales.length > itemsPerPage && (
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
  );
};

export default SalesHistory;