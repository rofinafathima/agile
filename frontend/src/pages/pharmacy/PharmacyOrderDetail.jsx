import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, User, MapPin, Phone, Mail, 
  Calendar, CheckCircle, Clock, Truck, FileText, 
  AlertCircle, ShieldCheck, Printer, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
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

const NEXT_STATUS_MAP = {
  confirmed: { next: 'preparing', label: 'Start Preparing' },
  preparing: { next: 'packed', label: 'Mark as Packed' },
  packed: { next: 'shipped', label: 'Handover to Courier (Ship)' },
  shipped: { next: 'out_for_delivery', label: 'Mark Out for Delivery' },
  out_for_delivery: { next: 'delivered', label: 'Confirm Delivered' },
};

const ALL_TRANSITIONS = ['confirmed', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export default function PharmacyOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pharmacy_token');
      const res = await api.get(`/pharmacies/portal/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data.order);
      setSelectedStatus(res.data.order.order_status);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (statusToSet) => {
    const status = statusToSet || selectedStatus;
    if (!status) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('pharmacy_token');
      await api.put(`/pharmacies/portal/orders/${id}/status`, {
        status,
        description: customNote.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status updated to ${STATUS_CONFIG[status]?.label || status}`);
      setCustomNote('');
      loadOrder();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 14 }}>Loading order details...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.6)' }}>
        <AlertCircle size={48} style={{ color: '#f87171', margin: '0 auto 16px' }} />
        <h2 style={{ color: 'white', fontSize: 20, marginBottom: 8 }}>Order Not Found</h2>
        <p style={{ marginBottom: 20 }}>This order may not be assigned to your pharmacy or does not exist.</p>
        <Link to="/pharmacy/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatusInfo = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.placed;
  const quickNext = NEXT_STATUS_MAP[order.order_status];
  const addr = order.delivery_address || {};

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', color: '#e2e8f0' }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/pharmacy/orders" 
            style={{ 
              width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', 
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' 
            }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>Order #{order.order_number}</h1>
              <span style={{ 
                background: currentStatusInfo.bg, color: currentStatusInfo.text, 
                fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                border: `1px solid ${currentStatusInfo.text}30`
              }}>
                {currentStatusInfo.label}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadOrder} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handlePrint} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Printer size={14} /> Print Slip
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Left Column (Items & Fulfillment Actions) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>
          
          {/* Status Progression & Action Banner */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 24px'
          }}>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#0ea5e9" /> Fulfillment & Status Management
            </h3>

            {/* Quick Action Button if next step exists */}
            {quickNext && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(56,189,248,0.05))',
                border: '1px solid rgba(14,165,233,0.3)', borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Next Step</div>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                    Advance order to <strong style={{ color: '#38bdf8' }}>{STATUS_CONFIG[quickNext.next]?.label}</strong>
                  </div>
                </div>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(quickNext.next)}
                  style={{
                    background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10,
                    padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(14,165,233,0.4)', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                  <CheckCircle size={16} /> {quickNext.label}
                </button>
              </div>
            )}

            {/* Manual Status Selector & Note */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 600 }}>
                  Change Status Manually
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', fontSize: 13, outline: 'none'
                  }}>
                  {ALL_TRANSITIONS.map(st => (
                    <option key={st} value={st} style={{ background: '#0f172a', color: 'white' }}>
                      {STATUS_CONFIG[st]?.label || st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 600 }}>
                  Add Note / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Packed batch #492, ready for courier"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <button
                disabled={updating || selectedStatus === order.order_status}
                onClick={() => handleUpdateStatus(selectedStatus)}
                style={{
                  padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: selectedStatus === order.order_status ? 'rgba(255,255,255,0.08)' : '#3b82f6',
                  color: selectedStatus === order.order_status ? 'rgba(255,255,255,0.3)' : 'white',
                  border: 'none', cursor: selectedStatus === order.order_status ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s', height: 42
                }}>
                {updating ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>

          {/* Ordered Medicines Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="#0ea5e9" /> Prescribed & Ordered Medicines ({order.items?.length || 0})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Medicine</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Unit Price</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                          }}>
                            💊
                          </div>
                          <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{item.medicine_name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{item.medicine_strength}</div>
                            {item.prescription_required ? (
                              <span style={{ display: 'inline-block', marginTop: 4, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                Rx REQUIRED
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 14 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        ₹{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: 'white', fontWeight: 700, fontSize: 14 }}>
                        ₹{Number(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Breakdown Footer */}
            <div style={{ padding: '18px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, marginLeft: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  <span>Subtotal:</span>
                  <span style={{ color: 'white' }}>₹{Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4ade80' }}>
                    <span>Discount:</span>
                    <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  <span>Delivery Fee:</span>
                  <span style={{ color: 'white' }}>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  <span>Tax (GST 5%):</span>
                  <span style={{ color: 'white' }}>₹{Number(order.tax || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#38bdf8', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Total Amount:</span>
                  <span>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log / Status History */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 24px'
          }}>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#0ea5e9" /> Order Status History & Audit Log
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 8 }}>
              {order.history?.map((h, i) => {
                const sConf = STATUS_CONFIG[h.status] || STATUS_CONFIG.placed;
                return (
                  <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    {/* Circle icon */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: sConf.bg,
                      color: sConf.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0, zIndex: 1
                    }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{sConf.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                          {new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {h.updated_by_name && (
                          <span style={{ fontSize: 11, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                            by {h.updated_by_name}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>
                        {h.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (Customer & Delivery Information) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Customer Details */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 24px'
          }}>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} color="#0ea5e9" /> Customer Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Customer Name</div>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 600, marginTop: 2 }}>{order.customer_name}</div>
              </div>

              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Phone Number</div>
                <div style={{ color: '#38bdf8', fontSize: 14, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} /> {order.customer_phone || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Email Address</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} /> {order.customer_email || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Details */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 24px'
          }}>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="#0ea5e9" /> Delivery Destination
            </h3>
            
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{addr.full_name || order.customer_name}</div>
              <div>{addr.address_line1}</div>
              {addr.address_line2 && <div>{addr.address_line2}</div>}
              <div>{addr.city}, {addr.state} — <strong>{addr.pincode}</strong></div>
              <div style={{ marginTop: 8, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={13} /> {addr.phone || order.customer_phone}
              </div>
            </div>

            {order.expected_delivery && (
              <div style={{
                marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 12
              }}>
                <Calendar size={14} color="#38bdf8" />
                <span>Expected by: <strong style={{ color: 'white' }}>{new Date(order.expected_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 24px'
          }}>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="#4ade80" /> Payment Status
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Payment Mode</div>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>Online / UPI / Card</div>
              </div>
              <span style={{
                background: order.payment_status === 'paid' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                color: order.payment_status === 'paid' ? '#4ade80' : '#fbbf24',
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase'
              }}>
                {order.payment_status || 'Pending'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
