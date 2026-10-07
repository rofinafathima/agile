import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, Home, Pill, Grid3X3, FileText, Package, ChevronDown, Shield } from 'lucide-react';
import SearchBar from './SearchBar';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">💊</span>
          E-Pharmacy
        </Link>

        <div className="navbar-search">
          <SearchBar />
        </div>

        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={16} />
            <span className="hide-sm">Home</span>
          </Link>

          <Link to="/medicines" className={`nav-link ${isActive('/medicines') ? 'active' : ''}`}>
            <Pill size={16} />
            <span className="hide-sm">Medicines</span>
          </Link>

          <Link to="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
            <Grid3X3 size={16} />
            <span className="hide-sm">Categories</span>
          </Link>

          {user ? (
            <>
              <Link to="/upload-prescription" className={`nav-link ${isActive('/upload-prescription') ? 'active' : ''}`}>
                <FileText size={16} />
                <span className="hide-sm">Rx Upload</span>
              </Link>

              <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
                <Package size={16} />
                <span className="hide-sm">Orders</span>
              </Link>

              {isAdmin && (
                <Link to="/admin" className="nav-link" style={{ color: 'var(--accent-600)', fontWeight: 700 }}>
                  <Shield size={16} />
                  Admin
                </Link>
              )}

              <Link to="/cart" className="nav-cart">
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </Link>

              {/* User dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  className="nav-link"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}
                >
                  <User size={16} />
                  <span className="hide-sm" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {showDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setShowDropdown(false)} />
                    <div className="search-dropdown" style={{ width: 200, zIndex: 200 }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{user.email}</div>
                      </div>
                      {[
                        { to: '/profile', label: '👤 My Profile' },
                        { to: '/orders', label: '📦 My Orders' },
                        { to: '/prescriptions', label: '📋 Prescriptions' },
                        { to: '/profile?tab=addresses', label: '📍 Addresses' },
                      ].map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="search-suggestion"
                          onClick={() => setShowDropdown(false)}
                        >
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      <button
                        className="search-suggestion"
                        style={{ width: '100%', color: 'var(--danger)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderTop: '1px solid var(--gray-100)' }}
                        onClick={handleLogout}
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-sm { display: none; }
          .navbar-inner { gap: 12px; padding: 0 16px; }
        }
      `}</style>
    </nav>
  );
}
