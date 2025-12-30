import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct, getProductCategories } from '../../../services/productService';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import toast from 'react-hot-toast';
import './AddProduct.css';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    quantityInStock: '',
    lowStockThreshold: '10',
    unit: 'pcs',
    description: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createProduct({
        ...formData,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantityInStock: parseInt(formData.quantityInStock),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
      });

      toast.success('Product added successfully!');
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">➕ Add New Product</h1>
        <p className="page-subtitle">Add a new product to your inventory</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="Product Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Liquid Soap"
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
                placeholder="Select or type new category"
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
              placeholder="0.00"
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
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />

            <Input
              label="Quantity in Stock"
              type="number"
              name="quantityInStock"
              value={formData.quantityInStock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              required
            />

            <Input
              label="Low Stock Threshold"
              type="number"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              placeholder="10"
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
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional product description"
              className="input-field textarea"
              rows="4"
            />
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/products')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={loading}>
              Add Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;