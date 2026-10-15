import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ChevronDown, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed: { bg: '#1e3a5f', text: '#60a5fa', label: 'Placed' },
  payment_confirmed: { bg: '#1a2d3a', text: '#38bdf8', label: 'Payment Confirmed' },
  prescription_verification: { bg: '#2d2d1a', text: '#fde68a', label: 'Rx Verification' },
  confirmed: { bg: '#1a3a2a', text: '#4ade80', label: 'Confirmed' },
  preparing: { bg: '#2d2a1a', text: '#fbbf24', label: 'Preparing' },
  packed: { bg: '#1e2a3a', text: '#818cf8', label: 'Packed' },
  shipped: { bg: '#1a2d3a', text: '#38bdf8', label: 'Shipped' },
  out_for_delivery: { bg: '#2d1a1a', text: '#fb923c', label: 'Out for Delivery' },
  delivered: { bg: '#1a3a2a', text: '#34d399', label: 'Delivered' },
  cancelled: { bg: '#3a1a1a', text: '#f87171', label: 'Cancelled' },
};

const ALLOWED_NEXT_STATUSES = {
  placed: ['confirmed'],
  prescription_verification: ['confirmed'],
  confirmed: ['preparing'],
  preparing: ['packed'],
  packed: ['shipped'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'placed', label: '🆕 Incoming' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'packed', label: 'Packed' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
];

export default function PharmacyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pharmacy_token');
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/pharmacies/portal/orders', {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('pharmacy_token');
      await api.put(`/pharmacies/portal/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Order status updated to "${STATUS_COLORS[newStatus]?.label}"`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: statusFilter === tab.value ? '#0ea5e9' : 'rgba(255,255,255,0.06)',
              color: statusFilter === tab.value ? 'white' : 'rgba(255,255,255,0.5)',
              border: statusFilter === tab.value ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
        <button onClick={loadOrders} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Orders Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            No orders found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Order #', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const sc = STATUS_COLORS[order.order_status] || STATUS_COLORS.placed;
                  const nextStatuses = ALLOWED_NEXT_STATUSES[order.order_status] || [];
                  return (
                    <tr key={order.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to={`/pharmacy/orders/${order.id}`} style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                          #{order.order_number}
                        </Link>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{order.customer_name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{order.customer_phone}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        {order.items?.length || 0} item(s)
                      </td>
                      <td style={{ padding: '14px 16px', color: 'white', fontSize: 13, fontWeight: 600 }}>
                        ₹{Number(order.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Link to={`/pharmacy/orders/${order.id}`}
                            style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            <Eye size={13} /> View
                          </Link>
                          {nextStatuses.length > 0 && (
                            <select
                              disabled={updating === order.id}
                              onChange={e => { if (e.target.value) updateStatus(order.id, e.target.value); e.target.value = ''; }}
                              style={{
                                padding: '6px 10px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                                border: '1px solid rgba(74,222,128,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none',
                              }}>
                              <option value="">Update Status</option>
                              {nextStatuses.map(s => (
                                <option key={s} value={s}>{STATUS_COLORS[s]?.label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
