import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, updateProduct, adjustStock, getProductCategories } from '../../../services/productService';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: '', reason: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productData, categoriesData] = await Promise.all([
        getProduct(id),
        getProductCategories()
      ]);
      setFormData(productData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProduct(id, {
        ...formData,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
      });

      toast.success('Product updated successfully!');
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!stockAdjustment.quantity) {
      toast.error('Please enter quantity');
      return;
    }

    try {
      await adjustStock(id, parseInt(stockAdjustment.quantity), stockAdjustment.reason);
      toast.success('Stock adjusted successfully!');
      setShowStockModal(false);
      setStockAdjustment({ quantity: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">✏️ Edit Product</h1>
        <p className="page-subtitle">Update product information</p>
      </div>

      <div className="form-container">
        <div className="current-stock-banner">
          <h3>Current Stock: {formData.quantityInStock} {formData.unit}</h3>
          <Button variant="warning" size="small" onClick={() => setShowStockModal(true)}>
            Adjust Stock
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="Product Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="input-group">
              <label htmlFor="category" className="input-label">
                Category <span className="required">*</span>
              </label>
              <input
                list="categories"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                required
              />
              <datalist id="categories">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <Input
              label="Cost Price (GH₵)"
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />

            <Input
              label="Selling Price (GH₵)"
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />

            <Input
              label="Low Stock Threshold"
              type="number"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              min="1"
              required
            />

            <div className="input-group">
              <label htmlFor="unit" className="input-label">
                Unit <span className="required">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="L">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="box">Boxes</option>
                <option value="pack">Packs</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="description" className="input-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="input-field textarea"
              rows="4"
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Adjust Stock"
        size="small"
      >
        <div className="stock-modal">
          <Input
            label="Quantity Change"
            type="number"
            name="quantity"
            value={stockAdjustment.quantity}
            onChange={(e) => setStockAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="e.g., +10 or -5"
            required
          />
          <small className="help-text">Use positive numbers to add stock, negative to reduce</small>

          <Input
            label="Reason"
            type="text"
            name="reason"
            value={stockAdjustment.reason}
            onChange={(e) => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="e.g., New stock arrival, Damaged goods"
          />

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowStockModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleStockAdjustment}>
              Adjust Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditProduct;