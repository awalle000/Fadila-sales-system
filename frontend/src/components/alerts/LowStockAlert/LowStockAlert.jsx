import './LowStockAlert.css';

const LowStockAlert = ({ products, onViewAll }) => {
  if (!products || products.length === 0) {
    return null;
  }

  const criticalProducts = products.filter(p => p.quantityInStock === 0);
  const lowStockProducts = products.filter(p => p.quantityInStock > 0);

  return (
    <div className="low-stock-alert">
      <div className="alert-header">
        <div className="alert-icon">⚠️</div>
        <div className="alert-title">
          <h3>Stock Alerts</h3>
          <p>{products.length} product(s) need attention</p>
        </div>
      </div>

      <div className="alert-body">
        {criticalProducts.length > 0 && (
          <div className="alert-section critical">
            <h4>🔴 Out of Stock ({criticalProducts.length})</h4>
            <ul>
              {criticalProducts.slice(0, 3).map(product => (
                <li key={product._id}>
                  <span className="product-name">{product.name}</span>
                  <span className="product-stock">0 {product.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="alert-section low">
            <h4>🟡 Low Stock ({lowStockProducts.length})</h4>
            <ul>
              {lowStockProducts.slice(0, 3).map(product => (
                <li key={product._id}>
                  <span className="product-name">{product.name}</span>
                  <span className="product-stock">
                    {product.quantityInStock} {product.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {products.length > 6 && (
        <div className="alert-footer">
          <button className="btn-view-all" onClick={onViewAll}>
            View All Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default LowStockAlert;