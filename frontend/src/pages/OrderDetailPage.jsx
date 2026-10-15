import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Circle, Clock, MapPin, Package, CreditCard, RotateCcw, Store } from 'lucide-react';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ALL_STATUSES = [
  { key: 'placed', label: 'Order Placed', icon: '📋', desc: 'Your order has been placed successfully.' },
  { key: 'payment_confirmed', label: 'Payment Confirmed', icon: '💳', desc: 'Your payment has been received.' },
  { key: 'prescription_verification', label: 'Prescription Verified', icon: '📋', desc: 'Prescription is being verified by our pharmacist.' },
  { key: 'confirmed', label: 'Order Confirmed', icon: '✅', desc: 'Order confirmed and sent to pharmacy.' },
  { key: 'preparing', label: 'Preparing', icon: '⚗️', desc: 'Your medicines are being prepared.' },
  { key: 'packed', label: 'Packed', icon: '📦', desc: 'Your order has been packed securely.' },
  { key: 'shipped', label: 'Shipped', icon: '🚚', desc: 'Your order is on its way.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵', desc: 'Your order is out for delivery.' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Order delivered successfully!' },
];

const STATUS_ORDER = ALL_STATUSES.map(s => s.key);

export default function OrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getById(id).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-wrapper page-container" style={{ paddingTop: 32 }}>
      <div className="loading-skeleton" style={{ height: 400, borderRadius: 16 }} />
    </div>
  );

  if (!data) return <div className="page-wrapper page-container" style={{ paddingTop: 32 }}>Order not found.</div>;

  const { order } = data;
  const isCancelled = order.order_status === 'cancelled';
  const currentIdx = STATUS_ORDER.indexOf(order.order_status);

  // Get history timestamps
  const historyMap = {};
  order.statusHistory?.forEach(h => { historyMap[h.status] = h.created_at; });

  const handleReorder = async () => {
    try {
      const { data: reorder } = await ordersAPI.reorder(order.id);
      toast.success(reorder.message);
    } catch (err) {
      toast.error('Reorder failed.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 4 }}>
              <Link to="/orders" style={{ color: 'var(--accent-600)' }}>← My Orders</Link>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>Order #{order.order_number}</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={handleReorder} className="btn btn-ghost btn-sm">
            <RotateCcw size={14} /> Reorder
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'flex-start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Order Tracking Timeline */}
            {!isCancelled ? (
              <div className="card">
                <div className="card-header"><span className="card-title">📍 Order Tracking</span>
                  {order.expected_delivery && (
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      Expected by {new Date(order.expected_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                <div className="card-body">
                  <div className="timeline">
                    {ALL_STATUSES.map((s, idx) => {
                      const done = currentIdx > idx;
                      const active = currentIdx === idx;
                      const ts = historyMap[s.key];
                      return (
                        <div key={s.key} className="timeline-item">
                          <div className={`timeline-dot ${done ? 'done' : active ? 'active' : 'pending'}`}>
                            {done ? <CheckCircle size={12} /> : active ? <Clock size={12} style={{ color: 'var(--accent-600)' }} /> : <Circle size={12} style={{ color: 'var(--gray-300)' }} />}
                          </div>
                          <div>
                            <div className="timeline-title" style={{ color: done || active ? 'var(--gray-800)' : 'var(--gray-400)' }}>
                              {s.icon} {s.label}
                            </div>
                            {ts && <div className="timeline-time">{new Date(ts).toLocaleString('en-IN')}</div>}
                            {active && <div className="timeline-desc">{s.desc}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '40px 28px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                  <h3 style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>Order Cancelled</h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{order.cancellation_reason}</p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="card">
              <div className="card-header"><span className="card-title"><Package size={18} style={{ marginRight: 8 }} />Items Ordered</span></div>
              {order.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 14, padding: '14px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ width: 44, height: 44, background: 'var(--gray-50)', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--gray-200)' }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`}
                        alt={item.medicine_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 22 }}>💊</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.medicine_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.medicine_strength} · Qty: {item.quantity}</div>
                    {item.prescription_required ? <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>Rx</span> : null}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>₹{item.total_price?.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>@₹{item.unit_price?.toFixed(2)} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 90 }}>
            {/* Price Breakdown */}
            <div className="card">
              <div className="card-header"><span className="card-title">Price Details</span></div>
              <div className="card-body">
                {[
                  { l: 'Subtotal', v: `₹${order.subtotal?.toFixed(2)}` },
                  ...(order.discount_amount > 0 ? [{ l: 'Discount', v: `-₹${order.discount_amount?.toFixed(2)}`, c: 'var(--success)' }] : []),
                  { l: 'Delivery', v: order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}` },
                  { l: 'GST (5%)', v: `₹${order.tax?.toFixed(2)}` },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid var(--gray-50)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: r.c || 'var(--gray-700)' }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, paddingTop: 12, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent-700)' }}>₹{order.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <div className="card-header"><span className="card-title"><CreditCard size={16} style={{ marginRight: 8 }} />Payment</span></div>
              <div className="card-body">
                <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                  <div>Method: {order.payment?.payment_method || 'Online'}</div>
                  {order.payment?.transaction_id && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--gray-400)' }}>Txn ID: {order.payment.transaction_id}</div>}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : order.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery_address && (
              <div className="card">
                <div className="card-header"><span className="card-title"><MapPin size={16} style={{ marginRight: 8 }} />Delivery Address</span></div>
                <div className="card-body">
                  <div style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.8 }}>
                    <strong>{order.delivery_address.full_name}</strong><br />
                    {order.delivery_address.address_line1}<br />
                    {order.delivery_address.address_line2 && <>{order.delivery_address.address_line2}<br /></>}
                    {order.delivery_address.city}, {order.delivery_address.state} — {order.delivery_address.pincode}<br />
                    📱 {order.delivery_address.phone}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Pharmacy Partner */}
            {order.pharmacy && (
              <div className="card" style={{ borderLeft: '3px solid var(--accent-600)' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title"><Store size={16} style={{ marginRight: 8, color: 'var(--accent-600)' }} />Fulfilling Pharmacy</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: 12 }}>
                    ⭐ {order.pharmacy.rating}
                  </span>
                </div>
                <div className="card-body">
                  <div style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--gray-900)' }}>{order.pharmacy.name}</strong><br />
                    <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>{order.pharmacy.address}, {order.pharmacy.city}</span><br />
                    <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>Pincode: {order.pharmacy.pincode}</span><br />
                    <span style={{ color: 'var(--accent-600)', fontSize: 13, fontWeight: 600 }}>📞 {order.pharmacy.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Prescription */}
            {order.prescription && (
              <div className="card">
                <div className="card-header"><span className="card-title">📋 Prescription</span></div>
                <div className="card-body">
                  <div style={{ fontSize: 14 }}>
                    <div>ID: #{order.prescription.id}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge ${order.prescription.status === 'approved' ? 'badge-success' : order.prescription.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {order.prescription.status}
                      </span>
                    </div>
                    {order.prescription.admin_notes && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-500)' }}>Note: {order.prescription.admin_notes}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
