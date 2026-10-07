import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, ChevronRight, RotateCcw, X, Eye } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_LABELS = {
  placed: { label: 'Order Placed', color: 'badge-info' },
  payment_confirmed: { label: 'Payment Confirmed', color: 'badge-success' },
  prescription_verification: { label: 'Prescription Verification', color: 'badge-warning' },
  confirmed: { label: 'Confirmed', color: 'badge-success' },
  preparing: { label: 'Preparing', color: 'badge-primary' },
  packed: { label: 'Packed', color: 'badge-primary' },
  shipped: { label: 'Shipped', color: 'badge-info' },
  out_for_delivery: { label: 'Out for Delivery', color: 'badge-warning' },
  delivered: { label: 'Delivered', color: 'badge-success' },
  cancelled: { label: 'Cancelled', color: 'badge-danger' },
};

const PAYMENT_LABELS = {
  pending: { label: 'Pending', color: 'badge-warning' },
  paid: { label: 'Paid', color: 'badge-success' },
  failed: { label: 'Failed', color: 'badge-danger' },
  refunded: { label: 'Refunded', color: 'badge-info' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const { data } = await ordersAPI.getAll();
      setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleCancel = async (orderId, orderNum) => {
    if (!window.confirm(`Cancel order #${orderNum}?`)) return;
    try {
      await ordersAPI.cancel(orderId, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled. Refund will be processed.');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot cancel this order.');
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const { data } = await ordersAPI.reorder(orderId);
      toast.success(data.message);
      if (data.warnings?.length > 0) data.warnings.forEach(w => toast.error(w));
    } catch (err) {
      toast.error('Reorder failed.');
    }
  };

  if (loading) return (
    <div className="page-wrapper page-container" style={{ paddingTop: 32 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="loading-skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 16 }} />)}
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <h1 className="page-title" style={{ marginBottom: 28 }}>My Orders</h1>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No Orders Yet</div>
            <div className="empty-state-text">You haven't placed any orders. Start shopping to see your orders here.</div>
            <Link to="/medicines" className="btn btn-primary"><Package size={16} /> Browse Medicines</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => {
              const statusInfo = STATUS_LABELS[order.order_status] || { label: order.order_status, color: 'badge-gray' };
              const payInfo = PAYMENT_LABELS[order.payment_status] || { label: order.payment_status, color: 'badge-gray' };
              const canCancel = ['placed', 'payment_confirmed', 'prescription_verification', 'confirmed'].includes(order.order_status);

              return (
                <div key={order.id} className="card animate-fadeIn">
                  <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 2 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)' }}>Order #{order.order_number}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                      <span className={`badge ${payInfo.color}`}>💳 {payInfo.label}</span>
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px' }}>
                    {/* Items */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {order.items?.slice(0, 3).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gray-50)', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>
                          {item.image_url ? (
                            <img
                              src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`}
                              alt={item.medicine_name}
                              style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }}
                            />
                          ) : '💊'}
                          <span style={{ fontWeight: 600 }}>{item.medicine_name}</span>
                          <span style={{ color: 'var(--gray-400)' }}>×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--gray-400)', padding: '6px 10px' }}>+{order.items.length - 3} more</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                        Total: <strong style={{ fontSize: 16, color: 'var(--gray-900)' }}>₹{order.total_amount?.toFixed(2)}</strong>
                        {order.expected_delivery && (
                          <span style={{ marginLeft: 16, fontSize: 12, color: 'var(--gray-400)' }}>
                            Expected by {new Date(order.expected_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {canCancel && (
                          <button onClick={() => handleCancel(order.id, order.order_number)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            <X size={13} /> Cancel
                          </button>
                        )}
                        <button onClick={() => handleReorder(order.id)} className="btn btn-ghost btn-sm">
                          <RotateCcw size={13} /> Reorder
                        </button>
                        <Link to={`/orders/${order.id}`} className="btn btn-primary btn-sm">
                          <Eye size={13} /> View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
