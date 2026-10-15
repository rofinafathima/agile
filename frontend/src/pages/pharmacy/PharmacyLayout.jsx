import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, FlaskConical, Bell, ChevronRight, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PharmacyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pharmacyUser, setPharmacyUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pharmacy_token');
    const user = localStorage.getItem('pharmacy_user');
    if (!token || !user) {
      navigate('/pharmacy/login');
      return;
    }
    setPharmacyUser(JSON.parse(user));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pharmacy_token');
    localStorage.removeItem('pharmacy_user');
    toast.success('Logged out successfully.');
    navigate('/pharmacy/login');
  };

  const navItems = [
    { path: '/pharmacy/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/pharmacy/orders', icon: <ClipboardList size={18} />, label: 'Orders' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 68, flexShrink: 0,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', overflow: 'hidden',
        position: 'relative', zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, minHeight: 72 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlaskConical size={18} color="white" />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}>Pharmacy Portal</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, whiteSpace: 'nowrap' }}>Partner Dashboard</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: sidebarOpen ? '11px 14px' : '11px',
                borderRadius: 10, marginBottom: 4, textDecoration: 'none',
                background: isActive(item.path) ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: isActive(item.path) ? '#0ea5e9' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>}
              {sidebarOpen && isActive(item.path) && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        {pharmacyUser && (
          <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {sidebarOpen && (
              <div style={{ padding: '10px 14px', marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pharmacyUser.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pharmacyUser.email}</div>
              </div>
            )}
            <button onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: sidebarOpen ? '11px 14px' : '11px', borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                justifyContent: sidebarOpen ? 'flex-start' : 'center', transition: 'all 0.15s',
              }}>
              <LogOut size={16} />
              {sidebarOpen && 'Sign Out'}
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>
            {navItems.find(n => n.path === location.pathname)?.label || 'Portal'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(14,165,233,0.3)' }}>
              🟢 ONLINE
            </span>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
