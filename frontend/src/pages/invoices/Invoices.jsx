import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import './Invoices.css';
import { format as formatDateFn } from 'date-fns';
import { formatCedis } from '../../utils/calculateProfit';
import { getInvoices, updateInvoice as updateInvoiceAPI, recordInvoicePayment as recordPaymentAPI, deleteInvoice as deleteInvoiceAPI } from '../../services/invoiceService';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const isManagerOrCEO = user?.role === 'manager' || user?.role === 'ceo';

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices(filterStatus ? { status: filterStatus } : {});
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
  }, [invoices]);

  const openInvoice = (inv) => {
    setSelectedInvoice(inv);
    setDueDateInput(inv?.dueDate ? inv.dueDate.split('T')[0] : '');
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleSetDueDate = async () => {
    if (!selectedInvoice) return;
    try {
      const updated = await updateInvoiceAPI(selectedInvoice._id, { dueDate: dueDateInput || null });
      await fetchInvoices();
      setSelectedInvoice(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      const updated = await recordPaymentAPI(selectedInvoice._id, amt, paymentNote);
      setPaymentAmount('');
      setPaymentNote('');
      await fetchInvoices();
      setSelectedInvoice(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      await deleteInvoiceAPI(id);
      await fetchInvoices();
      setSelectedInvoice(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container invoices-page">
      <div className="page-header">
        <h1 className="page-title">🧾 Invoices</h1>
        <p className="page-subtitle">All invoices (credit & cash). Managers & CEO can set due dates and record payments.</p>
      </div>

      <div className="invoices-layout">
        <div className="invoices-list">
          <div className="invoices-list-header">
            <h3>Recent Invoices</h3>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Outstanding</option>
                <option value="paid">Paid</option>
              </select>
              <div>{invoices.length} total</div>
            </div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="empty">
              <p>No invoices yet</p>
            </div>
          ) : (
            <ul>
              {sorted.map(inv => (
                <li key={inv._id} className={`invoice-row ${inv.status === 'paid' ? 'paid' : ''}`} onClick={() => openInvoice(inv)}>
                  <div className="left">
                    <div className="inv-title">{inv.receiptNumber}</div>
                    <div className="inv-sub">By: {inv.sellerName || inv.soldBy?.name} • {formatDateFn(new Date(inv.saleDate), 'Pp')}</div>
                  </div>
                  <div className="right">
                    <div className="inv-amount">{formatCedis(inv.totals.finalAmount)}</div>
                    <div className="inv-status">{inv.status === 'paid' ? 'Paid' : 'Outstanding'}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="invoices-detail">
          {!selectedInvoice ? (
            <div className="placeholder">
              <p>Select an invoice to view details, set due date, and record payments.</p>
            </div>
          ) : (
            <>
              <div className="inv-actions-row">
                <div>
                  <h2>{selectedInvoice.receiptNumber}</h2>
                  <div className="small">Sold by: {selectedInvoice.sellerName || selectedInvoice.soldBy?.name} • {formatDateFn(new Date(selectedInvoice.saleDate), 'Pp')}</div>
                  <div className="small">Customer: {selectedInvoice.customerName}</div>
                  <div className="small">Payment type: {selectedInvoice.paymentType}</div>
                </div>
                <div className="inv-actions">
                  <div className="big-amount">{formatCedis(selectedInvoice.totals.finalAmount)}</div>
                  <div className={`status-badge ${selectedInvoice.status}`}>{selectedInvoice.status}</div>
                </div>
              </div>

              <div className="inv-items">
                <h3>Items</h3>
                {selectedInvoice.items.map((it, idx) => (
                  <div key={idx} className="inv-item">
                    <div>
                      <strong>{it.productName}</strong> <small>({it.quantity} {it.unit} × {formatCedis(it.unitPrice)})</small>
                      {it.discount > 0 && <div className="item-discount">Discount: -{formatCedis(it.discount)}</div>}
                    </div>
                    <div className="item-right">{formatCedis(it.finalAmount)}</div>
                  </div>
                ))}
              </div>

              <div className="inv-totals">
                <div><span>Subtotal:</span><span>{formatCedis(selectedInvoice.totals.totalAmount)}</span></div>
                {selectedInvoice.totals.totalDiscount > 0 && (
                  <div><span>Discount:</span><span>-{formatCedis(selectedInvoice.totals.totalDiscount)}</span></div>
                )}
                <div className="final"><span>Total:</span><span>{formatCedis(selectedInvoice.totals.finalAmount)}</span></div>
                <div><span>Remaining:</span><span>{formatCedis(selectedInvoice.remainingBalance)}</span></div>
                {selectedInvoice.dueDate && <div><span>Due Date:</span><span>{formatDateFn(new Date(selectedInvoice.dueDate), 'P')}</span></div>}
              </div>

              <div className="inv-payments">
                <h3>Payments</h3>
                {selectedInvoice.payments.length === 0 ? <p>No payments yet</p> : (
                  <ul>
                    {selectedInvoice.payments.map(p => (
                      <li key={p._id || p.id}>
                        <div>{formatDateFn(new Date(p.date), 'Pp')}</div>
                        <div>{formatCedis(p.amount)}</div>
                        {p.note && <div className="small">{p.note}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="inv-controls">
                {isManagerOrCEO && (
                  <>
                    <div className="control-group">
                      <label>Set due date</label>
                      <input type="date" value={dueDateInput} onChange={(e) => setDueDateInput(e.target.value)} />
                      <Button variant="primary" onClick={handleSetDueDate}>Set Due Date</Button>
                    </div>

                    <div className="control-group">
                      <label>Record payment (partial)</label>
                      <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount" />
                      <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Note (optional)" />
                      <Button variant="success" onClick={handleAddPayment} disabled={!paymentAmount}>Record Payment</Button>
                    </div>
                  </>
                )}

                <div className="control-group-inline">
                  <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</Button>
                  {user?.role === 'ceo' && (
                    <Button variant="danger" onClick={() => handleDelete(selectedInvoice._id)}>Delete Invoice</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;