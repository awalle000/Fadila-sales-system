import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { SalesProvider } from './context/SalesContext';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar/Navbar';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Footer from './components/layout/Footer/Footer';
import './App.css';

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <AppRoutes />;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <AppRoutes />
          <Footer />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <SalesProvider>
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px'
                },
                success: {
                  iconTheme: {
                    primary: '#38ef7d',
                    secondary: '#fff'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#f5576c',
                    secondary: '#fff'
                  }
                }
              }}
            />
          </SalesProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;