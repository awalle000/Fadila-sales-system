import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import './Invoices.css';
import { format as formatDateFn } from 'date-fns';
import { formatCedis } from '../../utils/calculateProfit';
import {
  getInvoices,
  updateInvoice as updateInvoiceAPI,
  recordInvoicePayment as recordPaymentAPI,
  deleteInvoice as deleteInvoiceAPI
} from '../../services/invoiceService';

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

  // --- Print invoice ---
  const generateReceiptHTML = (inv) => {
    const seller = inv.sellerName || inv.soldBy?.name || 'Unknown';
    const date = formatDateFn(new Date(inv.saleDate), 'PPpp');
    const itemsHTML = inv.items.map(it => {
      return `
        <tr>
          <td style="padding:6px 8px; border-bottom:1px solid #eee;">
            <strong>${it.productName}</strong><br/>
            <small>${it.quantity} ${it.unit} × ${formatCedis(it.unitPrice)}</small>
            ${it.discount > 0 ? `<div style="color:#ef4444; font-size:0.9em">Discount: -${formatCedis(it.discount)}</div>` : ''}
          </td>
          <td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; vertical-align:top;">
            ${formatCedis(it.finalAmount)}
          </td>
        </tr>
      `;
    }).join('');

    const paymentsHTML = (inv.payments || []).map(p => {
      return `
        <tr>
          <td style="padding:4px 8px; border-bottom:1px solid #f6f6f6;">
            ${formatDateFn(new Date(p.date), 'PPpp')} ${p.note ? ` - ${p.note}` : ''}
          </td>
          <td style="padding:4px 8px; border-bottom:1px solid #f6f6f6; text-align:right;">
            ${formatCedis(p.amount)}
          </td>
        </tr>
      `;
    }).join('');

    const dueDateLine = inv.dueDate ? `<div>Due Date: ${formatDateFn(new Date(inv.dueDate), 'PP')}</div>` : '';

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice - ${inv.receiptNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111827; padding:20px; background:#f6f8fb; }
            .receipt { max-width:720px; margin:0 auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 6px 20px rgba(2,6,23,0.08); }
            .header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
            .brand { font-weight:900; color:#111827; font-size:1.1rem; letter-spacing:0.4px; }
            .meta { text-align:right; color:#6b7280; font-size:0.9rem; }
            table { width:100%; border-collapse:collapse; margin-top:16px; }
            tfoot td { font-weight:800; font-size:1.05rem; }
            .totals { margin-top:12px; width:100%; max-width:420px; float:right; }
            .small { color:#6b7280; font-size:0.9rem; }
            .center { text-align:center; }
            @media print {
              body { background: #fff; }
              .receipt { box-shadow:none; border-radius:0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div>
                <div class="brand">Fadila Impact Enterprise</div>
                <div class="small">Sales Invoice</div>
              </div>
              <div class="meta">
                <div>Invoice #: <strong>${inv.receiptNumber}</strong></div>
                <div>${date}</div>
                <div>Sold by: ${seller}</div>
                ${dueDateLine}
              </div>
            </div>

            <table>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div style="clear:both"></div>

            <div style="margin-top:18px; display:flex; justify-content:flex-end;">
              <table class="totals" style="border-collapse:collapse;">
                <tbody>
                  <tr>
                    <td style="padding:6px 8px; color:#6b7280;">Subtotal:</td>
                    <td style="padding:6px 8px; text-align:right;">${formatCedis(inv.totals.totalAmount)}</td>
                  </tr>
                  ${inv.totals.totalDiscount > 0 ? `
                    <tr>
                      <td style="padding:6px 8px; color:#ef4444;">Discount:</td>
                      <td style="padding:6px 8px; text-align:right; color:#ef4444;">-${formatCedis(inv.totals.totalDiscount)}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="padding:6px 8px;">Remaining:</td>
                    <td style="padding:6px 8px; text-align:right;">${formatCedis(inv.remainingBalance)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 8px; font-weight:800;">TOTAL:</td>
                    <td style="padding:10px 8px; text-align:right; font-weight:800; color:#111827;">${formatCedis(inv.totals.finalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="clear:both"></div>

            <div style="margin-top:20px;">
              <h4 style="margin:0 0 8px 0;">Payments</h4>
              <table style="width:100%; border-collapse:collapse;">
                <tbody>
                  ${paymentsHTML || '<tr><td style="padding:8px 0; color:#6b7280;">No payments yet</td><td></td></tr>'}
                </tbody>
              </table>
            </div>

            <div style="margin-top:28px; text-align:center; color:#6b7280; font-size:0.9rem;">
              Thank you for doing business with us!
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintInvoice = (inv) => {
    try {
      const html = generateReceiptHTML(inv);
      const printWindow = window.open('', '_blank', 'width=800,height=800');
      if (!printWindow) {
        alert('Please allow popups for this site to print invoices.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (err) {
      console.error('Print error', err);
      alert('Failed to open print dialog.');
    }
  };
  // --- End print invoice ---

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
                  <div style={{ marginTop: 8 }}>
                    <Button variant="primary" onClick={() => handlePrintInvoice(selectedInvoice)}>🖨️ Print Invoice</Button>
                  </div>
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