import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
  { section: 'Overview' },
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'Management' },
  { path: '/admin/pharmacies', icon: Store, label: 'Pharmacies' },
];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-sidebar-logo" style={{ textDecoration: 'none' }}>
            <span>💊</span> E-Pharmacy
          </Link>
          <div className="text-xs text-gray mt-1 ml-8 uppercase tracking-widest">Admin Panel</div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item, index) => {
            if (item.section) {
              return (
                <div key={`section-${index}`} className="admin-nav-section-label" style={{ marginTop: index === 0 ? 0 : 24 }}>
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <Link key={item.path} to={item.path} className={`admin-nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout} className="admin-nav-link text-danger hover:text-danger hover:bg-danger/10">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content" style={{ overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
