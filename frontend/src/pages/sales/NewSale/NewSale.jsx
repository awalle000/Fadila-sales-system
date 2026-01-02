import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getAllProducts } from '../../../services/productService';
import { recordSale } from '../../../services/salesService';
import { calculateProfit, calculateTotalRevenue, formatCedis } from '../../../utils/calculateProfit';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './NewSale.css';

const NewSale = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const isCEO = user?.role === 'ceo';

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      const availableProducts = data.filter(p => p.quantityInStock > 0);
      setProducts(availableProducts);
      setFilteredProducts(availableProducts);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const getSelectedProductDetails = () => {
    return products.find(p => p._id === selectedProduct);
  };

  const calculateSaleDetails = () => {
    const product = getSelectedProductDetails();
    if (!product || !quantity) return null;

    const qty = parseInt(quantity);
    const totalRevenue = calculateTotalRevenue(product.sellingPrice, qty);
    const profit = calculateProfit(product.costPrice, product.sellingPrice, qty);

    return {
      totalRevenue,
      profit,
      available: product.quantityInStock
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const product = getSelectedProductDetails();
    const qty = parseInt(quantity);

    if (qty > product.quantityInStock) {
      toast.error(`Insufficient stock! Only ${product.quantityInStock} ${product.unit} available`);
      return;
    }

    setSaving(true);

    try {
      await recordSale({
        productId: selectedProduct,
        quantitySold: qty,
        notes
      });

      toast.success('Sale recorded successfully!');
      navigate('/sales/history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const saleDetails = calculateSaleDetails();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💰 New Sale</h1>
        <p className="page-subtitle">Record a new sales transaction</p>
      </div>

      <div className="sale-form-container">
        <form onSubmit={handleSubmit}>
          {/* Search Bar */}
          <div className="input-group">
            <label htmlFor="search" className="input-label">
              🔍 Search Products
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or category..."
              className="input-field"
            />
            {searchTerm && (
              <small className="help-text">
                {filteredProducts.length} product(s) found
              </small>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="product" className="input-label">
              Select Product <span className="required">*</span>
            </label>
            <select
              id="product"
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setQuantity('');
              }}
              className="input-field"
              required
            >
              <option value="">-- Select a product --</option>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {formatCedis(product.sellingPrice)} ({product.quantityInStock} {product.unit} available)
                  </option>
                ))
              ) : (
                <option value="" disabled>No products found</option>
              )}
            </select>
            {filteredProducts.length === 0 && searchTerm && (
              <small className="help-text error">
                No products match "{searchTerm}". Try a different search term.
              </small>
            )}
          </div>

          {selectedProduct && (
            <>
              <div className="input-group">
                <label htmlFor="quantity" className="input-label">
                  Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  max={getSelectedProductDetails()?.quantityInStock}
                  className="input-field"
                  required
                />
                <small className="help-text">
                  Available: {getSelectedProductDetails()?.quantityInStock} {getSelectedProductDetails()?.unit}
                </small>
              </div>

              <div className="input-group">
                <label htmlFor="notes" className="input-label">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this sale"
                  className="input-field textarea"
                  rows="3"
                />
              </div>

              {saleDetails && (
                <div className="sale-summary">
                  <h3>Sale Summary</h3>
                  <div className="summary-row">
                    <span>Product:</span>
                    <span className="value">{getSelectedProductDetails().name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Unit Price:</span>
                    <span className="value">{formatCedis(getSelectedProductDetails().sellingPrice)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Quantity:</span>
                    <span className="value">{quantity} {getSelectedProductDetails().unit}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span className="value">{formatCedis(saleDetails.totalRevenue)}</span>
                  </div>
                  {/* ✅ Only show profit to CEO */}
                  {isCEO && (
                    <div className="summary-row profit">
                      <span>Expected Profit:</span>
                      <span className="value">{formatCedis(saleDetails.profit)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/sales/history')}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={saving} disabled={!selectedProduct || !quantity}>
              Record Sale
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSale;