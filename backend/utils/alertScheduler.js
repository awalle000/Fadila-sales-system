import cron from 'node-cron';
import Invoice from '../models/Invoice.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { formatCedis } from './calculateProfit.js';

// Function to check and alert for overdue invoices
export const checkOverdueInvoices = async () => {
  try {
    const currentDate = new Date();
    const overdueInvoices = await Invoice.find({
      paymentType: 'credit',
      dueDate: { $lt: currentDate },
      outstandingBalance: { $gt: 0 }
    })
      .populate('sale', 'productName')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    if (overdueInvoices.length > 0) {
      console.log('\n🚨 OVERDUE INVOICE ALERT 🚨');
      console.log(`${overdueInvoices.length} invoice(s) are overdue:\n`);

      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor((currentDate - invoice.dueDate) / (1000 * 60 * 60 * 24));
        console.log(`- Invoice ${invoice.invoiceNumber}: ${invoice.customerName}, Outstanding: ${formatCedis(invoice.outstandingBalance)}, Days Overdue: ${daysOverdue}`);

        // Log to ActivityLog for dashboard tracking
        await ActivityLog.create({
          user: invoice.createdBy._id, // Or a system user ID
          userName: 'System',
          action: 'OVERDUE_ALERT',
          details: `Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue. Outstanding: ${formatCedis(invoice.outstandingBalance)}`,
          ipAddress: 'System'
        });

        // TODO: Add email notification here (e.g., using nodemailer)
        // Example: sendEmail(invoice.createdBy.email, 'Overdue Invoice Alert', details);

        // TODO: Emit Socket.io event for real-time dashboard alert
        // Example: io.emit('overdueAlert', { invoiceId: invoice._id, daysOverdue });
      }

      console.log('\n');
    } else {
      console.log('✅ No overdue invoices today');
    }
  } catch (error) {
    console.error('Error checking overdue invoices:', error.message);
  }
};

// Schedule the cron job (runs daily at 9 AM)
export const scheduleOverdueAlerts = () => {
  cron.schedule('0 9 * * *', () => {
    console.log('🔍 Checking for overdue invoices...');
    checkOverdueInvoices();
  });
};