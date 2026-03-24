import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { setCredentials } from '../store/authSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setCredentials(data));
      toast.success(`Welcome back, ${data.name}! 🏎️`);
      navigate(data.isAdmin ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-hw">HW</span>
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your Hot Wheels account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-icon-wrap">
              <FiMail className="input-icon" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required style={{ paddingLeft: '42px' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingLeft: '42px', paddingRight: '42px' }} />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-demo">
          <p>Demo credentials:</p>
          <code>admin@hotwheels.com / admin123</code>
          <br />
          <code>john@example.com / test123</code>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one →</Link>
        </p>
      </div>

      <style>{`
        .auth-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 60px 20px; background: radial-gradient(ellipse at center, rgba(255,45,32,0.05) 0%, transparent 70%); }
        .auth-card { width: 100%; max-width: 440px; background: var(--dark-2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 48px 40px; }
        .auth-logo { display: flex; justify-content: center; margin-bottom: 24px; }
        .auth-title { font-family: var(--font-heading); font-size: 1.8rem; text-transform: uppercase; text-align: center; margin-bottom: 8px; }
        .auth-subtitle { color: var(--gray); text-align: center; font-family: var(--font-accent); margin-bottom: 32px; }
        .input-icon-wrap { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--gray); font-size: 1rem; pointer-events: none; }
        .input-icon-right { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--gray); cursor: pointer; font-size: 1rem; }
        .auth-demo { margin: 20px 0; padding: 14px; background: var(--dark-3); border: 1px solid var(--border); border-radius: 8px; font-size: 0.82rem; color: var(--gray); text-align: center; }
        .auth-demo p { font-family: var(--font-accent); font-weight: 600; margin-bottom: 6px; color: var(--yellow); }
        .auth-demo code { font-size: 0.78rem; color: var(--gray); }
        .auth-switch { text-align: center; margin-top: 20px; color: var(--gray); font-family: var(--font-accent); }
        .auth-switch a { color: var(--red); font-weight: 700; }
      `}</style>
    </div>
  );
};

export default LoginPage;
