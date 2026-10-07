import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function CartPage() {
  const { cart, loading, fetchCart, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated]);

  if (!isAuthenticated) return (
    <div className="page-wrapper page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <div className="empty-state-title">Please Login</div>
        <div className="empty-state-text">Login to view and manage your cart.</div>
        <Link to="/login" className="btn btn-primary">Login Now</Link>
      </div>
    </div>
  );

  if (!cart || cart.items?.length === 0) return (
    <div className="page-wrapper page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <div className="empty-state-title">Your Cart is Empty</div>
        <div className="empty-state-text">Browse medicines and add items to your cart to get started.</div>
        <Link to="/medicines" className="btn btn-primary"><ShoppingBag size={16} /> Browse Medicines</Link>
      </div>
    </div>
  );

  const handleUpdate = async (id, qty) => {
    const result = await updateItem(id, qty);
    if (!result.success) toast.error(result.error);
  };

  const handleRemove = async (id, name) => {
    const result = await removeItem(id);
    if (result.success) toast.success(`${name} removed from cart.`);
    else toast.error(result.error);
  };

  const hasUnavailable = cart.items?.some(i => !i.is_available || !i.in_stock);

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <h1 className="page-title" style={{ marginBottom: 28 }}>
          🛒 My Cart <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--gray-400)' }}>({cart.itemCount} items)</span>
        </h1>

        {hasUnavailable && (
          <div className="alert alert-warning" style={{ marginBottom: 24 }}>
            ⚠️ Some items in your cart are unavailable or out of stock. Please remove them before checkout.
          </div>
        )}

        {cart.hasPrescriptionItems && (
          <div className="alert alert-info" style={{ marginBottom: 24 }}>
            📋 Your cart contains prescription medicines. You'll need to upload a valid prescription during checkout.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'flex-start' }}>
          {/* Cart Items */}
          <div className="card">
            {cart.items.map(item => (
              <div key={item.id} className="cart-item" style={{ opacity: item.is_available ? 1 : 0.6 }}>
                <div className="cart-item-image">
                  {item.image_url ? <img src={`${BASE}${item.image_url}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '💊'}
                </div>
                <div className="cart-item-info">
                  <Link to={`/medicines/${item.medicine_id}`} className="cart-item-name" style={{ textDecoration: 'none', display: 'block', color: 'var(--gray-800)' }}>
                    {item.name}
                  </Link>
                  <div className="cart-item-sub">
                    {item.strength && `${item.strength} · `}{item.dosage_form}
                    {item.prescription_required && <span style={{ marginLeft: 6, color: 'var(--warning)', fontSize: 11, fontWeight: 600 }}>Rx</span>}
                  </div>
                  {!item.is_available && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>⚠️ Unavailable</div>}
                  {item.is_available && !item.in_stock && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>⚠️ Insufficient stock ({item.stock_quantity} available)</div>}
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-400)' }}>
                    ₹{item.calculated_unit_price?.toFixed(2)} × {item.quantity} = <strong style={{ color: 'var(--gray-800)' }}>₹{item.item_total?.toFixed(2)}</strong>
                    {item.discount > 0 && <span style={{ marginLeft: 8, color: 'var(--success)', fontSize: 11 }}>({item.discount}% off)</span>}
                  </div>
                </div>

                <div className="cart-item-actions">
                  <button onClick={() => handleRemove(item.id, item.name)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                  <div className="qty-selector">
                    <button className="qty-btn" onClick={() => handleUpdate(item.id, item.quantity - (item.individually_dispensable ? 1 : item.pack_size))} disabled={item.quantity <= (item.individually_dispensable ? item.min_order_quantity : item.pack_size)}>
                      <Minus size={12} />
                    </button>
                    <span className="qty-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => handleUpdate(item.id, item.quantity + (item.individually_dispensable ? 1 : item.pack_size))} disabled={item.quantity >= item.stock_quantity}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="cart-item-price">₹{item.item_total?.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title">Order Summary</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--gray-600)' }}>Subtotal ({cart.itemCount} items)</span>
                    <span style={{ fontWeight: 600 }}>₹{cart.subtotal?.toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--success)' }}><Tag size={13} style={{ marginRight: 4 }} />Discount</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>-₹{cart.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--gray-600)' }}><Truck size={13} style={{ marginRight: 4 }} />Delivery Fee</span>
                    <span style={{ fontWeight: 600, color: cart.deliveryFee === 0 ? 'var(--success)' : 'var(--gray-700)' }}>
                      {cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--gray-600)' }}>GST (5%)</span>
                    <span style={{ fontWeight: 600 }}>₹{cart.tax?.toFixed(2)}</span>
                  </div>
                  {cart.deliveryFee > 0 && (
                    <div style={{ background: 'var(--accent-50)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--accent-700)', fontWeight: 600 }}>
                      🚚 Add ₹{(499 - cart.subtotal).toFixed(2)} more for FREE delivery!
                    </div>
                  )}
                  <div className="divider" style={{ margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--gray-900)' }}>₹{cart.total?.toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                      🎉 You save ₹{cart.discount?.toFixed(2)} on this order!
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={hasUnavailable}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
                <Link to="/medicines" className="btn btn-ghost btn-full" style={{ marginTop: 10, fontSize: 13 }}>
                  <ShoppingBag size={14} /> Continue Shopping
                </Link>
              </div>
            </div>

            {/* Security badges */}
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Safe & Secure</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['🔒 SSL Secured', '✅ 100% Authentic', '↩️ Easy Returns'].map(b => (
                  <span key={b} style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
