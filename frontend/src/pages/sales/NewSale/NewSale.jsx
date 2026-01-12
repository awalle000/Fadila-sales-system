import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getAllProducts } from '../../../services/productService';
import { recordSale } from '../../../services/salesService';
import { createInvoice as createInvoiceAPI } from '../../../services/invoiceService'; // NEW
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
  const [discount, setDiscount] = useState(''); // ✅ NEW: Discount state
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentType, setPaymentType] = useState('cash'); // NEW: cash | credit
  const [customerName, setCustomerName] = useState('Walk-in'); // NEW
  const [cart, setCart] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef();
  
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

  // ✅ Add item to cart with discount
  const addToCart = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Please select a product and quantity');
      return;
    }

    const product = getSelectedProductDetails();
    const qty = parseInt(quantity);
    const discountAmount = parseFloat(discount) || 0;

    if (qty > product.quantityInStock) {
      toast.error(`Insufficient stock! Only ${product.quantityInStock} ${product.unit} available`);
      return;
    }

    const totalAmount = calculateTotalRevenue(product.sellingPrice, qty);

    // ✅ Validate discount
    if (discountAmount < 0) {
      toast.error('Discount cannot be negative');
      return;
    }

    if (discountAmount > totalAmount) {
      toast.error('Discount cannot exceed total amount');
      return;
    }

    const finalAmount = totalAmount - discountAmount;
    const totalCost = product.costPrice * qty;
    const profit = finalAmount - totalCost;

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.productId === selectedProduct);
    
    if (existingIndex >= 0) {
      toast.error('Product already in cart. Remove it first to add with different quantity/discount.');
      return;
    }

    // Add new item
    const cartItem = {
      productId: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.sellingPrice,
      costPrice: product.costPrice,
      unit: product.unit,
      totalAmount,
      discount: discountAmount,
      finalAmount,
      profit
    };
    
    setCart([...cart, cartItem]);
    toast.success(`${product.name} added to cart`);

    // Reset form
    setSelectedProduct('');
    setQuantity('');
    setDiscount('');
    setSearchTerm('');
  };

  // ✅ Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.success('Item removed from cart');
  };

  // ✅ Calculate cart totals
  const getCartTotals = () => {
    const totalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
    const finalAmount = cart.reduce((sum, item) => sum + item.finalAmount, 0);
    const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    return { totalAmount, totalDiscount, finalAmount, totalProfit, totalItems };
  };

  // ✅ Complete sale (record all items)
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    // If credit, prompt for confirmation (optional)
    if (paymentType === 'credit' && (!customerName || customerName.trim() === '')) {
      toast.error('Please provide customer name for credit sales');
      return;
    }

    setSaving(true);

    try {
      // Record each item as a separate sale (existing behaviour)
      const salePromises = cart.map(item =>
        recordSale({
          productId: item.productId,
          quantitySold: item.quantity,
          discount: item.discount,
          notes: `Multi-item sale - ${cart.length} products`
        })
      );

      const sales = await Promise.all(salePromises);

      // Prepare receipt data
      const totals = getCartTotals();
      const newReceiptData = {
        items: cart,
        totals,
        saleDate: new Date(),
        soldBy: user.name,
        receiptNumber: `RCP-${Date.now()}`
      };

      setReceiptData(newReceiptData);
      setShowReceipt(true);

      // If credit -> create invoice on backend
      if (paymentType === 'credit') {
        try {
          const payload = {
            receiptNumber: `INV-${Date.now()}`,
            items: cart.map(it => ({
              product: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              discount: it.discount,
              finalAmount: it.finalAmount,
              unit: it.unit
            })),
            totals,
            saleDate: new Date().toISOString(),
            soldBy: user._id,
            sellerName: user.name,
            customerName: customerName || 'Walk-in',
            paymentType: 'credit',
            payments: [],
            notes: `Credit sale recorded by ${user.name}`
          };

          await createInvoiceAPI(payload);
          toast.success('Credit invoice recorded on server. Manager/CEO can set due date and accept partial payments.');
        } catch (err) {
          console.error('Invoice API error', err);
          toast.error('Sale recorded but failed to create invoice on server (check logs).');
        }
      } else {
        toast.success('Sale completed successfully!');
      }

      setCart([]); // Clear cart
      fetchProducts(); // Refresh product stock
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to complete sale');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Print receipt
  const handlePrint = () => {
    const printContent = receiptRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData?.receiptNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; padding: 5px 0; }
            .discount-line { color: #ef4444; font-size: 0.9em; }
            .totals { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const cartTotals = getCartTotals();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💰 New Sale</h1>
        <p className="page-subtitle">Add products to cart and complete sale</p>
      </div>

      <div className="sale-layout">
        {/* Left: Add Products */}
        <div className="sale-form-container">
          <h2 className="section-title">Add Products</h2>
          
          {/* Payment Type */}
          <div className="input-group">
            <label htmlFor="paymentType" className="input-label">
              Payment Type
            </label>
            <select id="paymentType" value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="input-field">
              <option value="cash">Cash (Paid immediately)</option>
              <option value="credit">Credit (Customer to pay later)</option>
            </select>
            <small className="help-text">Choose if the customer pays now or buys on credit.</small>
          </div>

          {/* Customer (for credit) */}
          {paymentType === 'credit' && (
            <div className="input-group">
              <label htmlFor="customerName" className="input-label">
                Customer Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name (for credit records)"
                className="input-field"
              />
              <small className="help-text">Enter customer name so managers can follow up.</small>
            </div>
          )}

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
                setDiscount('');
              }}
              className="input-field"
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
                />
                <small className="help-text">
                  Available: {getSelectedProductDetails()?.quantityInStock} {getSelectedProductDetails()?.unit}
                </small>
              </div>

              {/* ✅ NEW: Discount Input */}
              <div className="input-group">
                <label htmlFor="discount" className="input-label">
                  💸 Discount (Optional)
                </label>
                <input
                  type="number"
                  id="discount"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Enter discount amount (GH₵)"
                  min="0"
                  max={quantity ? calculateTotalRevenue(getSelectedProductDetails()?.sellingPrice, parseInt(quantity)) : 0}
                  step="0.01"
                  className="input-field"
                />
                <small className="help-text">
                  {discount && quantity ? `You're giving ${formatCedis(parseFloat(discount))} discount` : 'Enter amount to reduce from total (e.g., 20 for GH₵ 20 off)'}
                </small>
              </div>

              {/* ✅ Sale Preview with Discount */}
              {quantity && (
                <div className="sale-preview">
                  <div className="preview-row">
                    <span>Subtotal:</span>
                    <span>{formatCedis(calculateTotalRevenue(getSelectedProductDetails().sellingPrice, parseInt(quantity)))}</span>
                  </div>
                  {discount && parseFloat(discount) > 0 && (
                    <div className="preview-row discount">
                      <span>Discount:</span>
                      <span>- {formatCedis(parseFloat(discount))}</span>
                    </div>
                  )}
                  <div className="preview-row final">
                    <span>Final Price:</span>
                    <span>{formatCedis(calculateTotalRevenue(getSelectedProductDetails().sellingPrice, parseInt(quantity)) - (parseFloat(discount) || 0))}</span>
                  </div>
                </div>
              )}
            </>
          )}

          <Button 
            type="button" 
            variant="primary" 
            onClick={addToCart}
            disabled={!selectedProduct || !quantity}
            fullWidth
          >
            ➕ Add to Cart
          </Button>
        </div>

        {/* Right: Shopping Cart */}
        <div className="cart-container">
          <h2 className="section-title">Shopping Cart ({cart.length})</h2>
          
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>🛒 Cart is empty</p>
              <small>Add products to start a sale</small>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="item-details">
                      <h4>{item.productName}</h4>
                      <p>{item.quantity} {item.unit} × {formatCedis(item.unitPrice)}</p>
                      {item.discount > 0 && (
                        <p className="item-discount">Discount: -{formatCedis(item.discount)}</p>
                      )}
                    </div>
                    <div className="item-actions">
                      <div className="item-pricing">
                        {item.discount > 0 && (
                          <span className="original-price">{formatCedis(item.totalAmount)}</span>
                        )}
                        <span className="item-total">{formatCedis(item.finalAmount)}</span>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Total Items:</span>
                  <span>{cartTotals.totalItems}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCedis(cartTotals.totalAmount)}</span>
                </div>
                {cartTotals.totalDiscount > 0 && (
                  <div className="summary-row discount">
                    <span>Total Discount:</span>
                    <span>-{formatCedis(cartTotals.totalDiscount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Final Amount:</span>
                  <span>{formatCedis(cartTotals.finalAmount)}</span>
                </div>
                {isCEO && (
                  <div className="summary-row profit">
                    <span>Expected Profit:</span>
                    <span>{formatCedis(cartTotals.totalProfit)}</span>
                  </div>
                )}
              </div>

              <div className="cart-actions">
                <Button 
                  variant="secondary" 
                  onClick={() => setCart([])}
                >
                  Clear Cart
                </Button>
                <Button 
                  variant="success" 
                  onClick={completeSale}
                  loading={saving}
                >
                  Complete Sale
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ Receipt Modal with Discount */}
      {showReceipt && receiptData && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div ref={receiptRef} className="receipt">
              <div className="header">
                <h2>SALES RECEIPT</h2>
                <p><strong>Fadila Enterprise</strong></p>
                <p>Receipt #: {receiptData.receiptNumber}</p>
                <p>{new Date(receiptData.saleDate).toLocaleString()}</p>
                <p>Sold by: {receiptData.soldBy}</p>
              </div>

              <div className="items">
                {receiptData.items.map((item, index) => (
                  <div key={index}>
                    <div className="item">
                      <div>
                        <strong>{item.productName}</strong>
                        <br />
                        <small>{item.quantity} {item.unit} × {formatCedis(item.unitPrice)}</small>
                      </div>
                      <div>{formatCedis(item.totalAmount)}</div>
                    </div>
                    {item.discount > 0 && (
                      <div className="item discount-line">
                        <div>Discount</div>
                        <div>-{formatCedis(item.discount)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="totals">
                <div className="item">
                  <span>Total Items:</span>
                  <span>{receiptData.totals.totalItems}</span>
                </div>
                <div className="item">
                  <span>Subtotal:</span>
                  <span>{formatCedis(receiptData.totals.totalAmount)}</span>
                </div>
                {receiptData.totals.totalDiscount > 0 && (
                  <div className="item discount-line">
                    <span>Total Discount:</span>
                    <span>-{formatCedis(receiptData.totals.totalDiscount)}</span>
                  </div>
                )}
                <div className="item">
                  <span><strong>TOTAL AMOUNT:</strong></span>
                  <span><strong>{formatCedis(receiptData.totals.finalAmount)}</strong></span>
                </div>
                {receiptData.totals.totalDiscount > 0 && (
                  <div className="item" style={{fontSize: '0.9em', color: '#10b981'}}>
                    <span>You Saved:</span>
                    <span>{formatCedis(receiptData.totals.totalDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="footer">
                <p>Thank you for your business!</p>
                <p>Visit us again soon 😊</p>
              </div>
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowReceipt(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handlePrint}>
                🖨️ Print Receipt
              </Button>
              <Button variant="success" onClick={() => {
                setShowReceipt(false);
                navigate('/sales/history');
              }}>
                View Sales History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;