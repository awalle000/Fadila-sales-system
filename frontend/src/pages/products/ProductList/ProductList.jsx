import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getAllProducts, deleteProduct, getProductCategories } from '../../../services/productService';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './ProductList.css';

const ProductList = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 products per page
  
  const navigate = useNavigate();
  const isCEO = user?.role === 'ceo';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, selectedCategory, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(),
        getProductCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load products');
      console.error('Products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // ✅ Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // ✅ Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // ✅ Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Product Management</h1>
          <p className="page-subtitle">{products.length} products in inventory</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/products/add')}>
          + Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Products
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Showing results info */}
      {filteredProducts.length > 0 && (
        <div className="results-info">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
        </div>
      )}

      {/* Products Grid */}
      <div className="products-grid">
        {currentProducts.length > 0 ? (
          currentProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-header">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category">{product.category}</span>
              </div>

              <div className="product-body">
                <div className="product-price">
                  <div className="price-item">
                    <span className="price-label">Cost:</span>
                    <span className="price-value cost">GH₵ {product.costPrice?.toFixed(2)}</span>
                  </div>
                  <div className="price-item">
                    <span className="price-label">Selling:</span>
                    <span className="price-value selling">GH₵ {product.sellingPrice?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="product-stock">
                  <span className="stock-label">Stock:</span>
                  <span className={`stock-value ${product.quantityInStock <= product.lowStockThreshold ? 'low' : ''}`}>
                    {product.quantityInStock} {product.unit}
                  </span>
                </div>

                {product.quantityInStock <= product.lowStockThreshold && (
                  <div className="stock-alert">
                    {product.quantityInStock === 0 ? '🔴 Out of Stock' : '🟡 Low Stock'}
                  </div>
                )}

                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
              </div>

              <div className="product-actions">
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => navigate(`/products/edit/${product._id}`)}
                >
                  Edit
                </Button>
                {isCEO && (
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(product._id, product.name)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-products">
            <p>📦 No products found</p>
            <Button variant="primary" onClick={() => navigate('/products/add')}>
              Add Your First Product
            </Button>
          </div>
        )}
      </div>

      {/* ✅ Pagination Controls */}
      {filteredProducts.length > itemsPerPage && (
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

export default ProductList;