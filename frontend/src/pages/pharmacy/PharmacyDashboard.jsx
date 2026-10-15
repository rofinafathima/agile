import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, IndianRupee, Clock, ArrowRight, ShoppingBag, RefreshCw } from 'lucide-react';
import { pharmacyPortalAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed: { bg: '#1e3a5f', text: '#60a5fa', label: 'Placed' },
  confirmed: { bg: '#1a3a2a', text: '#4ade80', label: 'Confirmed' },
  preparing: { bg: '#2d2a1a', text: '#fbbf24', label: 'Preparing' },
  packed: { bg: '#1e2a3a', text: '#818cf8', label: 'Packed' },
  shipped: { bg: '#1a2d3a', text: '#38bdf8', label: 'Shipped' },
  out_for_delivery: { bg: '#2d1a1a', text: '#fb923c', label: 'Out for Delivery' },
  delivered: { bg: '#1a3a2a', text: '#34d399', label: 'Delivered' },
  cancelled: { bg: '#3a1a1a', text: '#f87171', label: 'Cancelled' },
};

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'white', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function PharmacyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pharmacy_token');
      const res = await api.get('/pharmacies/portal/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data) return null;

  const { pharmacy, stats, recentOrders } = data;

  return (
    <div>
      {/* Pharmacy info banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.08))',
        border: '1px solid rgba(14,165,233,0.2)', borderRadius: 16,
        padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ color: '#0ea5e9', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Your Pharmacy</div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{pharmacy.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>
            {pharmacy.address}, {pharmacy.city} · {pharmacy.phone} · License: {pharmacy.license_number}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fbbf24', fontSize: 20 }}>⭐</span>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>{pharmacy.rating}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Rating</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={<ShoppingBag size={22} />} label="Total Orders" value={stats.totalOrders} color="#0ea5e9" />
        <StatCard icon={<Clock size={22} />} label="Pending" value={stats.pendingOrders} color="#fbbf24" sub="To process" />
        <StatCard icon={<Truck size={22} />} label="Out for Delivery" value={stats.outForDelivery} color="#fb923c" />
        <StatCard icon={<CheckCircle size={22} />} label="Delivered" value={stats.delivered} color="#4ade80" />
        <StatCard icon={<IndianRupee size={22} />} label="Revenue" value={`₹${Number(stats.revenue).toFixed(0)}`} color="#818cf8" sub="All time" />
      </div>

      {/* Recent Orders */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recent Orders</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={loadDashboard} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <Link to="/pharmacy/orders" style={{ color: '#0ea5e9', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            No orders assigned to your pharmacy yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Order #', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => {
                const sc = STATUS_COLORS[order.order_status] || STATUS_COLORS.placed;
                return (
                  <tr key={order.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <Link to={`/pharmacy/orders/${order.id}`} style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                        #{order.order_number}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'white', fontSize: 13 }}>{order.customer_name}</td>
                    <td style={{ padding: '14px 20px', color: 'white', fontSize: 13, fontWeight: 600 }}>₹{Number(order.total_amount).toFixed(2)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
