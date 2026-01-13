import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      
      // Wait for state to update before navigating
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
        // Force a page refresh to ensure all components load
        window.location.reload();
      }, 200);
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-circle circle-1"></div>
        <div className="gradient-circle circle-2"></div>
        <div className="gradient-circle circle-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🧼</div>
          <h1 className="login-title">Fadila Impact Enterprise</h1>
          <p className="login-subtitle">Sales Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            size="large"
            disabled={!email || !password}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="login-footer">
          <div className="demo-credentials">
            <h4>Version 1.0.0</h4>
            {/* <p><strong>CEO:</strong> ceo@soapshop.com / Admin@123</p> */}
            <p className="login-hint">Create Manager accounts after logging in</p>
          </div>
          <p className="login-version">Develop by Taudjudeen || 0539228560</p>
        </div>
      </div>
    </div>
  );
};

export default Login;