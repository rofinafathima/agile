import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, FlaskConical } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PharmacyLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      if (data.user.role !== 'pharmacy') {
        toast.error('This portal is for pharmacy partners only.');
        return;
      }
      localStorage.setItem('pharmacy_token', data.token);
      localStorage.setItem('pharmacy_user', JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/pharmacy/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Inter', 'Outfit', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 320, height: 320, background: 'rgba(14,165,233,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 260, height: 260, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', filter: 'blur(80px)' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 16px 40px rgba(14,165,233,0.35)',
          }}>
            <FlaskConical size={36} color="white" />
          </div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Pharmacy Portal
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 6 }}>
            E-Pharmacy Partner Management
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '36px 40px',
        }}>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Sign in to your account</h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="pharmacy@example.com"
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, fontSize: 14,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '13px 44px 13px 42px', borderRadius: 10, fontSize: 14,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(14,165,233,0.3)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></> : <><ShieldCheck size={18} /> Sign In to Portal</>}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(14,165,233,0.1)', borderRadius: 10, border: '1px solid rgba(14,165,233,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Pharmacy Logins (Click to autofill):</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Apollo MG Road (Bangalore)', email: 'apollo.mg@pharmacy.com' },
                { label: 'Apollo Fort (Mumbai)', email: 'apollo.mumbai@pharmacy.com' },
                { label: 'Metro Meds (Delhi CP)', email: 'metro.delhi@pharmacy.com' },
              ].map(demo => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => setForm({ email: demo.email, password: 'Pharmacy@123' })}
                  style={{
                    background: form.email === demo.email ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                    padding: '6px 10px', color: 'white', fontSize: 12, textAlign: 'left',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <span>🏪 {demo.label}</span>
                  <span style={{ color: '#0ea5e9', fontSize: 11, fontWeight: 600 }}>Use</span>
                </button>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '8px 0 0' }}>Password for all: <strong>Pharmacy@123</strong></p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 20 }}>
          Customer?{' '}
          <Link to="/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Go to Customer Login →</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
