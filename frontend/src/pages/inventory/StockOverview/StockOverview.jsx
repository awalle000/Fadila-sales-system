import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../../services/productService';
import { formatCedis } from '../../../utils/calculateProfit';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './StockOverview.css';

const StockOverview = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, filter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (filter === 'low') {
      filtered = filtered.filter(p => p.quantityInStock <= p.lowStockThreshold && p.quantityInStock > 0);
    } else if (filter === 'out') {
      filtered = filtered.filter(p => p.quantityInStock === 0);
    } else if (filter === 'good') {
      filtered = filtered.filter(p => p.quantityInStock > p.lowStockThreshold);
    }

    setFilteredProducts(filtered);
  };

  const calculateInventoryValue = () => {
    const totalValue = filteredProducts.reduce((sum, p) => sum + (p.costPrice * p.quantityInStock), 0);
    const potentialRevenue = filteredProducts.reduce((sum, p) => sum + (p.sellingPrice * p.quantityInStock), 0);
    const potentialProfit = potentialRevenue - totalValue;

    return { totalValue, potentialRevenue, potentialProfit };
  };

  const getStockStatus = (product) => {
    if (product.quantityInStock === 0) return 'out-of-stock';
    if (product.quantityInStock <= product.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (product) => {
    if (product.quantityInStock === 0) return '🔴 Out of Stock';
    if (product.quantityInStock <= product.lowStockThreshold) return '🟡 Low Stock';
    return '🟢 In Stock';
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const inventoryValue = calculateInventoryValue();
  const lowStockCount = products.filter(p => p.quantityInStock <= p.lowStockThreshold && p.quantityInStock > 0).length;
  const outOfStockCount = products.filter(p => p.quantityInStock === 0).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📋 Stock Overview</h1>
        <p className="page-subtitle">Monitor your inventory levels</p>
      </div>

      {/* Inventory Summary */}
      <div className="inventory-summary">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Inventory Value</h3>
            <div className="summary-value">{formatCedis(inventoryValue.totalValue)}</div>
            <small>Cost price of stock</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>Potential Revenue</h3>
            <div className="summary-value">{formatCedis(inventoryValue.potentialRevenue)}</div>
            <small>If all stock sold</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <h3>Potential Profit</h3>
            <div className="summary-value profit">{formatCedis(inventoryValue.potentialProfit)}</div>
            <small>Gross profit margin</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <h3>Stock Alerts</h3>
            <div className="summary-value alert">{lowStockCount + outOfStockCount}</div>
            <small>{outOfStockCount} out, {lowStockCount} low</small>
          </div>
        </div>
      </div>

      {/* Stock Filters */}
      <div className="stock-filters">
        <button
          className={`stock-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Products ({products.length})
        </button>
        <button
          className={`stock-filter-btn ${filter === 'good' ? 'active' : ''}`}
          onClick={() => setFilter('good')}
        >
          🟢 In Stock
        </button>
        <button
          className={`stock-filter-btn ${filter === 'low' ? 'active' : ''}`}
          onClick={() => setFilter('low')}
        >
          🟡 Low Stock ({lowStockCount})
        </button>
        <button
          className={`stock-filter-btn ${filter === 'out' ? 'active' : ''}`}
          onClick={() => setFilter('out')}
        >
          🔴 Out of Stock ({outOfStockCount})
        </button>
      </div>

      {/* Stock Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Status</th>
              <th>Cost Value</th>
              <th>Selling Value</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id} className={getStockStatus(product)}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td className="stock-qty">
                    {product.quantityInStock} {product.unit}
                  </td>
                  <td>{product.lowStockThreshold} {product.unit}</td>
                  <td>
                    <span className={`status-badge ${getStockStatus(product)}`}>
                      {getStockStatusText(product)}
                    </span>
                  </td>
                  <td>{formatCedis(product.costPrice * product.quantityInStock)}</td>
                  <td className="revenue">{formatCedis(product.sellingPrice * product.quantityInStock)}</td>
                  <td>
                    <button
                      className="btn-edit-stock"
                      onClick={() => navigate(`/products/edit/${product._id}`)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockOverview;