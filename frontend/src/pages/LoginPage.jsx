import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    const result = await login(form);
    if (result.success) {
      await fetchCartCount();
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      if (result.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } else {
      setError(result.error);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@epharmacy.com', password: 'Admin@123456' });
    else setForm({ email: 'user@epharmacy.com', password: 'User@123456' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--navy-800) 0%, #1a3a3a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800, color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            💊 <span style={{ background: 'linear-gradient(135deg, #5eead4, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>E-Pharmacy</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 14 }}>Your trusted online pharmacy</p>
        </div>

        <div className="card animate-slideUp" style={{ borderRadius: 20, border: 'none', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
          <div className="card-body" style={{ padding: '32px 36px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>Welcome Back</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>Sign in to your E-Pharmacy account</p>

            {/* Demo credentials */}
            <div style={{ background: 'var(--accent-50)', border: '1px solid var(--accent-200)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-700)', marginBottom: 8 }}>🧪 Demo Accounts:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fillDemo('customer')} className="btn btn-sm" style={{ flex: 1, fontSize: 11, background: 'white', border: '1px solid var(--accent-300)', color: 'var(--accent-700)', fontWeight: 600, padding: '6px 10px' }}>
                  👤 Customer Login
                </button>
                <button onClick={() => fillDemo('admin')} className="btn btn-sm" style={{ flex: 1, fontSize: 11, background: 'white', border: '1px solid var(--accent-300)', color: 'var(--accent-700)', fontWeight: 600, padding: '6px 10px' }}>
                  🛡️ Admin Login
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 20, padding: '12px 14px', fontSize: 13 }}>
                <AlertCircle size={16} className="alert-icon" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password <span className="required">*</span>
                  <Link to="/forgot-password" style={{ float: 'right', fontSize: 12, color: 'var(--accent-600)', fontWeight: 500 }}>Forgot Password?</Link>
                </label>
                <div className="input-wrapper icon-right">
                  <Lock size={16} className="input-icon" />
                  <input name="password" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Enter your password" value={form.password} onChange={handleChange} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`} disabled={loading}>
                {!loading && <>Sign In <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0' }} />

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--accent-600)', fontWeight: 700 }}>Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
