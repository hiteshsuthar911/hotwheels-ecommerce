import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { setCredentials } from '../store/authSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      dispatch(setCredentials(data));
      toast.success(`Welcome to HotWheels, ${data.name}! 🏎️`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'radial-gradient(ellipse at center, rgba(255,45,32,0.05) 0%, transparent 70%)' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <span className="logo-hw">HW</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>Create Account</h2>
        <p style={{ color: 'var(--gray)', textAlign: 'center', fontFamily: 'var(--font-accent)', marginBottom: '32px' }}>Join the Hot Wheels collector community</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { field: 'name', label: 'Full Name', icon: <FiUser />, type: 'text', placeholder: 'John Racer' },
            { field: 'email', label: 'Email Address', icon: <FiMail />, type: 'email', placeholder: 'your@email.com' },
          ].map(({ field, label, icon, type, placeholder }) => (
            <div className="form-group" key={field}>
              <label>{label}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', pointerEvents: 'none' }}>{icon}</span>
                <input type={type} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder} required style={{ paddingLeft: '42px' }} />
              </div>
            </div>
          ))}
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required style={{ paddingLeft: '42px', paddingRight: '42px' }} />
              <button type="button" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer' }} onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" required style={{ paddingLeft: '42px' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--gray)', fontFamily: 'var(--font-accent)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Sign In →</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
