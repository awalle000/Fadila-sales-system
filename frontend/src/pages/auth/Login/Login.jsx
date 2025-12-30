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
      if (user.role === 'ceo') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'manager') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setLoading(true);

    try {
      const userData = await login(email, password);
      
      // Navigate based on role
      if (userData.role === 'ceo') {
        navigate('/dashboard', { replace: true });
      } else if (userData.role === 'manager') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
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
          <h1 className="login-title">Soap Shop System</h1>
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
            <h4>Demo Credentials:</h4>
            <p><strong>CEO:</strong> ceo@soapshop.com / Admin@123</p>
            <p className="login-hint">Create Manager accounts after logging in</p>
          </div>
          <p className="login-version">Version 1.0.0 | Currency: GH₵</p>
        </div>
      </div>
    </div>
  );
};

export default Login;