import React, { useState, useEffect } from 'react';
import { Package, Users, Pill, TrendingUp, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await adminAPI.getDashboard();
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await adminAPI.updateOrderStatus(id, { status });
      toast.success('Status updated');
      fetchDashboard();
    } catch (err) { toast.error('Update failed'); }
  };

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (!stats) return <div className="p-6">Failed to load data.</div>;

  return (
    <div className="admin-content-inner">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{stats.revenue?.toFixed(2)}</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--success)', color: 'white' }}><TrendingUp size={24} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders}</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--info)', color: 'white' }}><Package size={24} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers}</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--purple-500)', color: 'white' }}><Users size={24} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <div className="stat-label">Total Medicines</div>
              <div className="stat-value">{stats.totalMedicines}</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-500)', color: 'white' }}><Pill size={24} /></div>
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><AlertTriangle className="text-warning" size={18} /> Low Stock Alerts ({stats.lowStockItems})</span></div>
          <div className="card-body">
            {stats.lowStockItems > 0 ? (
              <p className="text-sm text-gray">There are items that need restocking.</p>
            ) : (
              <p className="text-sm text-success flex items-center gap-2"><CheckCircle size={16} /> Inventory levels are good.</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><FileText className="text-info" size={18} /> Pending Prescriptions ({stats.pendingPrescriptions})</span></div>
          <div className="card-body">
            {stats.pendingPrescriptions > 0 ? (
              <p className="text-sm text-gray">Requires pharmacist verification.</p>
            ) : (
              <p className="text-sm text-success flex items-center gap-2"><CheckCircle size={16} /> All caught up.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header"><span className="card-title">Recent Orders</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-4 text-gray">No recent orders.</td></tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="font-semibold">#{order.order_number}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>{order.user_name}</td>
                    <td className="font-semibold">₹{order.total_amount?.toFixed(2)}</td>
                    <td><span className={`badge ${order.order_status === 'delivered' ? 'badge-success' : order.order_status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{order.order_status}</span></td>
                    <td>
                      <select 
                        className="form-select text-xs py-1 px-2 w-auto" 
                        value={order.order_status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        disabled={order.order_status === 'delivered' || order.order_status === 'cancelled'}
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
