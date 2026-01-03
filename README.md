# 🧼 Fadila Enterprise - Sales Management System

A comprehensive sales management system for soap and chemicals shop built with MongoDB, Express, React, and Node.js.

## 🌟 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (CEO & Manager)
- Secure password hashing with bcrypt
- Session management with sessionStorage

### Product Management
- Add, edit, and delete products
- Track inventory with low stock alerts
- Support for multiple units (kg, g, L, ml, boxes, packs)
- Product categories and search

### Sales Management
- Point-of-sale functionality
- Automatic stock deduction
- Discount support
- Sales receipts
- Real-time profit calculation

### Reports & Analytics
- Daily sales reports
- Monthly sales reports
- Profit & Loss statements
- Top-selling products
- Sales analytics charts

### Activity Monitoring
- Complete activity logging
- User action tracking
- Login/logout history
- Filter by activity type

### Automated Tasks
- Low stock alerts (Daily 8:00 AM)
- Daily sales summary (Daily 6:00 PM)

## 🔒 Security Features

- ✅ Rate limiting (prevents brute force attacks)
- ✅ Input validation & sanitization
- ✅ CORS protection
- ✅ Security headers (Helmet)
- ✅ Request size limits
- ✅ Strong password requirements

## 💻 Tech Stack

**Frontend:**
- React 18
- Vite
- React Router
- Axios
- Recharts (for analytics)
- CSS3 (fully responsive)

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Bcrypt password hashing
- Node-cron (automated tasks)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/fadila-enterprise-sales-system.git
cd fadila-enterprise-sales-system

👥 User Roles
CEO (Full Access)
✅ View all data including profits
✅ Add/edit/delete products
✅ Record sales
✅ View all reports
✅ Manage users
✅ View activity logs
Manager (Limited Access)
✅ Add/edit products (cannot delete)
✅ Record sales
✅ View sales history (no profit visibility)
✅ View inventory
❌ Cannot see profit data
❌ Cannot manage users
❌ Cannot delete products
📱 Responsive Design
The application is fully responsive and works on:

💻 Desktop (1920px+)
💻 Laptop (1024px - 1920px)
📱 Tablet (768px - 1024px)
📱 Mobile (480px - 768px)
📱 Small Mobile (360px - 480px)
💰 Currency
All monetary values are in Ghana Cedis (GH₵)

📊 Product Units
Supported units:

Kilograms (kg) - Heavy solids
Grams (g) - Light solids
Litres (L) - Bulk liquids
Millilitres (ml) - Small liquids
Boxes - Bulk packaging
Packs - Consumer bundles
🔐 Security Best Practices
Never commit .env files
Use strong passwords (min 8 chars with uppercase, lowercase, number, symbol)
Change default CEO password immediately
Enable HTTPS in production
Regularly update dependencies: npm audit fix
📝 License

