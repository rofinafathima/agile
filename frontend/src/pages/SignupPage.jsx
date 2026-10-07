import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock, Calendar, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[@$!%*?&#]/.test(password) },
  ];
  const score = checks.filter(c => c.met).length;
  const colors = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--warning)', 'var(--success)'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 9999, background: i < score ? colors[score - 1] : 'var(--gray-200)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: 11, color: c.met ? 'var(--success)' : 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {c.met ? <CheckCircle size={10} /> : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const { register, loading } = useAuth();
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', date_of_birth: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const result = await register(form);
    if (result.success) {
      await fetchCartCount();
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--navy-800), #1a3a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            💊 <span style={{ background: 'linear-gradient(135deg, #5eead4, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>E-Pharmacy</span>
          </Link>
        </div>

        <div className="card animate-slideUp" style={{ borderRadius: 20, border: 'none', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
          <div className="card-body" style={{ padding: '32px 36px' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>Create Your Account</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 24 }}>Join thousands of customers who trust E-Pharmacy</p>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 20, padding: '12px 14px', fontSize: 13 }}>
                <AlertCircle size={16} className="alert-icon" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input name="name" type="text" className="form-input" placeholder="Your full name" value={form.name} onChange={handleChange} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input name="email" type="email" className="form-input" placeholder="Email address" value={form.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mobile <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Phone size={16} className="input-icon" />
                    <input name="phone" type="tel" className="form-input" placeholder="10-digit number" value={form.phone} onChange={handleChange} maxLength={10} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Date of Birth</label>
                <div className="input-wrapper">
                  <Calendar size={16} className="input-icon" />
                  <input name="date_of_birth" type="date" className="form-input" value={form.date_of_birth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input name="password" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Create a strong password" value={form.password} onChange={handleChange} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && <PasswordStrength password={form.password} />}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input name="confirmPassword" type={showConfPwd ? 'text' : 'password'} className="form-input" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} />
                  <button type="button" onClick={() => setShowConfPwd(!showConfPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex' }}>
                    {showConfPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <div className="form-error"><AlertCircle size={12} /> Passwords do not match</div>
                )}
              </div>

              <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.6 }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </div>

              <button type="submit" className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`} disabled={loading}>
                {!loading && <>Create Account <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0' }} />
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-600)', fontWeight: 700 }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
