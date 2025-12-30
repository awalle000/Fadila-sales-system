import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Auth
import Login from '../pages/auth/Login/Login';

// Dashboards
import CEODashboard from '../pages/dashboard/CEODashboard/CEODashboard';
import ManagerDashboard from '../pages/dashboard/ManagerDashboard/ManagerDashboard';

// Products
import ProductList from '../pages/products/ProductList/ProductList';
import AddProduct from '../pages/products/AddProduct/AddProduct';
import EditProduct from '../pages/products/EditProduct/EditProduct';

// Sales
import NewSale from '../pages/sales/NewSale/NewSale';
import SalesHistory from '../pages/sales/SalesHistory/SalesHistory';

// Reports
import DailyReport from '../pages/reports/DailyReport/DailyReport';
import MonthlyReport from '../pages/reports/MonthlyReport/MonthlyReport';
import ProfitLoss from '../pages/reports/ProfitLoss/ProfitLoss';

// Inventory
import StockOverview from '../pages/inventory/StockOverview/StockOverview';

// Activity
import ActivityLogs from '../pages/activity/ActivityLogs/ActivityLogs';

// Users
import UserManagement from '../pages/users/UserManagement/UserManagement';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'ceo' ? '/ceo-dashboard' : '/manager-dashboard'} replace /> : <Login />} />

      {/* Protected Routes */}
      <Route
        path="/ceo-dashboard"
        element={
          <ProtectedRoute allowedRoles={['ceo']}>
            <CEODashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager-dashboard"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Products - CEO & Manager */}
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <ProductList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/add"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <AddProduct />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/edit/:id"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <EditProduct />
          </ProtectedRoute>
        }
      />

      {/* Sales - CEO & Manager */}
      <Route
        path="/sales/new"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <NewSale />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/history"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <SalesHistory />
          </ProtectedRoute>
        }
      />

      {/* Inventory - CEO & Manager */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <StockOverview />
          </ProtectedRoute>
        }
      />

      {/* Reports - CEO & Manager */}
      <Route
        path="/reports/daily"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <DailyReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/monthly"
        element={
          <ProtectedRoute allowedRoles={['ceo', 'manager']}>
            <MonthlyReport />
          </ProtectedRoute>
        }
      />

      {/* Profit/Loss - CEO Only */}
      <Route
        path="/reports/profit-loss"
        element={
          <ProtectedRoute allowedRoles={['ceo']}>
            <ProfitLoss />
          </ProtectedRoute>
        }
      />

      {/* Activity Logs - CEO Only */}
      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute allowedRoles={['ceo']}>
            <ActivityLogs />
          </ProtectedRoute>
        }
      />

      {/* User Management - CEO Only */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['ceo']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={user ? (user.role === 'ceo' ? '/ceo-dashboard' : '/manager-dashboard') : '/login'} replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;