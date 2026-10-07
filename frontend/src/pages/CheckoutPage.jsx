import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, CreditCard, CheckCircle, ArrowRight, Plus, FileText, AlertTriangle, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addressesAPI, prescriptionsAPI, ordersAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STEPS = [
  { id: 1, label: 'Cart Review' },
  { id: 2, label: 'Delivery' },
  { id: 3, label: 'Prescription' },
  { id: 4, label: 'Summary' },
  { id: 5, label: 'Payment' },
];

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', full_name: user?.name || '', phone: user?.phone || '', address_line1: '', city: '', state: '', pincode: '' });

  useEffect(() => { fetchCart(); }, []);
  useEffect(() => {
    addressesAPI.getAll().then(r => {
      setAddresses(r.data.addresses);
      const def = r.data.addresses.find(a => a.is_default);
      if (def) setSelectedAddress(def.id);
      else if (r.data.addresses.length > 0) setSelectedAddress(r.data.addresses[0].id);
    }).catch(console.error);
    prescriptionsAPI.getAll().then(r => setPrescriptions(r.data.prescriptions)).catch(console.error);
  }, []);

  if (!cart || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="spinner" />
    </div>
  );

  const hasPrescriptionItems = cart.hasPrescriptionItems;

  const handleAddAddress = async () => {
    setLoading(true);
    try {
      const { data } = await addressesAPI.add({ ...addressForm, is_default: addresses.length === 0 });
      setAddresses(prev => [...prev, data.address]);
      setSelectedAddress(data.address.id);
      setShowAddressForm(false);
      toast.success('Address added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add address.');
    } finally { setLoading(false); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address.'); return; }
    if (hasPrescriptionItems && !selectedPrescription) { toast.error('Please select a prescription for Rx medicines.'); return; }
    setLoading(true);
    try {
      const { data } = await ordersAPI.create({
        address_id: selectedAddress,
        prescription_id: selectedPrescription || null,
        payment_method: paymentMethod,
      });
      setOrder(data.order);
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order.');
    } finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data } = await paymentsAPI.simulate({ order_id: order.id });
      toast.success('Payment successful!');
      navigate(`/orders/${order.id}?paid=true`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed.');
    } finally { setLoading(false); }
  };

  const Stepper = () => (
    <div className="stepper" style={{ marginBottom: 36 }}>
      {STEPS.filter(s => hasPrescriptionItems || s.id !== 3).map((s, idx, arr) => (
        <React.Fragment key={s.id}>
          <div className="step">
            <div className={`step-circle ${step > s.id ? 'done' : step === s.id ? 'active' : 'pending'}`}>
              {step > s.id ? <CheckCircle size={16} /> : s.id}
            </div>
            <span className={`step-label ${step === s.id ? 'active' : 'pending'}`}>{s.label}</span>
          </div>
          {idx < arr.length - 1 && <div className={`step-line ${step > s.id ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28, paddingBottom: 60, maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 28 }}>Checkout</h1>
        <Stepper />

        {/* Step 1: Cart Review */}
        {step === 1 && (
          <div className="card animate-fadeIn">
            <div className="card-header"><span className="card-title">Review Your Cart</span></div>
            <div>
              {cart.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--gray-200)' }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 24 }}>💊</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.strength} · Qty: {item.quantity}</div>
                    {item.prescription_required && <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>Rx Required</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)' }}>₹{item.item_total?.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Total: <strong style={{ fontSize: 18, color: 'var(--gray-900)' }}>₹{cart.total?.toFixed(2)}</strong></div>
              </div>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Select Address <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Delivery Address */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title"><MapPin size={18} style={{ marginRight: 8 }} />Delivery Address</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddressForm(!showAddressForm)}>
                  <Plus size={14} /> Add New
                </button>
              </div>
              <div className="card-body" style={{ padding: '0' }}>
                {showAddressForm && (
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
                    <div className="grid-2" style={{ marginBottom: 12 }}>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Full Name *</label>
                        <input className="form-input" value={addressForm.full_name} onChange={e => setAddressForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Phone *</label>
                        <input className="form-input" value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit phone" />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Address Line 1 *</label>
                      <input className="form-input" value={addressForm.address_line1} onChange={e => setAddressForm(p => ({ ...p, address_line1: e.target.value }))} placeholder="Street, area, locality" />
                    </div>
                    <div className="grid-2" style={{ marginBottom: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">City *</label>
                        <input className="form-input" value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">State *</label>
                        <input className="form-input" value={addressForm.state} onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))} placeholder="State" />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Pincode *</label>
                      <input className="form-input" style={{ maxWidth: 160 }} value={addressForm.pincode} onChange={e => setAddressForm(p => ({ ...p, pincode: e.target.value }))} placeholder="6-digit pincode" maxLength={6} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className={`btn btn-primary btn-sm ${loading ? 'btn-loading' : ''}`} onClick={handleAddAddress} disabled={loading}>Save Address</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAddressForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
                {addresses.length === 0 && !showAddressForm && (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <div className="empty-state-icon" style={{ fontSize: 40 }}>📍</div>
                    <div className="empty-state-title" style={{ fontSize: 16 }}>No addresses saved</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddressForm(true)}><Plus size={14} /> Add Address</button>
                  </div>
                )}
                {addresses.map(addr => (
                  <div key={addr.id} onClick={() => setSelectedAddress(addr.id)} style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: selectedAddress === addr.id ? 'var(--accent-50)' : 'white', transition: 'background 0.2s', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <input type="radio" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} style={{ marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{addr.full_name} <span className="badge badge-gray" style={{ marginLeft: 6, fontSize: 10 }}>{addr.label}</span></div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                        {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                        {addr.city}, {addr.state} — {addr.pincode}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>📱 {addr.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" disabled={!selectedAddress} onClick={() => setStep(hasPrescriptionItems ? 3 : 4)}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Prescription */}
        {step === 3 && hasPrescriptionItems && (
          <div className="animate-fadeIn">
            <div className="card">
              <div className="card-header">
                <span className="card-title"><FileText size={18} style={{ marginRight: 8 }} />Select Prescription</span>
              </div>
              <div className="card-body">
                <div className="medical-disclaimer" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  Your cart contains prescription medicines. Please select a previously uploaded prescription or upload a new one.
                </div>
                {prescriptions.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>No prescriptions found</div>
                    <button className="btn btn-primary" onClick={() => navigate('/upload-prescription')}>Upload Prescription</button>
                  </div>
                ) : (
                  prescriptions.map(rx => (
                    <div key={rx.id} onClick={() => setSelectedPrescription(rx.id)} style={{ padding: '14px 16px', border: `2px solid ${selectedPrescription === rx.id ? 'var(--accent-600)' : 'var(--gray-200)'}`, borderRadius: 12, marginBottom: 10, cursor: 'pointer', background: selectedPrescription === rx.id ? 'var(--accent-50)' : 'white', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input type="radio" checked={selectedPrescription === rx.id} readOnly />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          Prescription #{rx.id} — {new Date(rx.created_at).toLocaleDateString('en-IN')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          Dr. {rx.doctor_name || 'Unknown'} · Patient: {rx.patient_name}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <span className={`badge ${rx.status === 'approved' ? 'badge-success' : rx.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                            {rx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/upload-prescription')} style={{ marginTop: 10 }}>
                  <Upload size={14} /> Upload New Prescription
                </button>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" disabled={!selectedPrescription} onClick={() => setStep(4)}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary & Payment Method */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Order Summary</span></div>
              <div className="card-body">
                {/* Items */}
                {cart.items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-700)' }}>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>₹{item.item_total?.toFixed(2)}</span>
                  </div>
                ))}
                {[
                  { label: 'Subtotal', value: `₹${cart.subtotal?.toFixed(2)}` },
                  ...(cart.discount > 0 ? [{ label: 'Discount', value: `-₹${cart.discount?.toFixed(2)}`, color: 'var(--success)' }] : []),
                  { label: 'Delivery', value: cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}` },
                  { label: 'GST (5%)', value: `₹${cart.tax?.toFixed(2)}` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                    <span style={{ color: 'var(--gray-500)' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color || 'var(--gray-700)' }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 16, fontWeight: 800, borderTop: '2px solid var(--gray-100)', marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent-700)' }}>₹{cart.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title"><CreditCard size={18} style={{ marginRight: 8 }} />Payment Method</span></div>
              <div className="card-body">
                {[
                  { id: 'online', icon: '💳', label: 'Online Payment (Demo)', sub: 'UPI, Cards, Net Banking — Simulated for demo' },
                  { id: 'cod', icon: '💵', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                ].map(pm => (
                  <div key={pm.id} className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`} onClick={() => setPaymentMethod(pm.id)}>
                    <input type="radio" checked={paymentMethod === pm.id} readOnly />
                    <span style={{ fontSize: 24 }}>{pm.icon}</span>
                    <div>
                      <div className="payment-option-label">{pm.label}</div>
                      <div className="payment-option-sub">{pm.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(hasPrescriptionItems ? 3 : 2)}>← Back</button>
                <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handlePlaceOrder} disabled={loading}>
                  {!loading && <>Place Order · ₹{cart.total?.toFixed(2)} <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && order && (
          <div className="animate-fadeIn">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Complete Payment</span>
                <span className="badge badge-warning">Order #{order.order_number}</span>
              </div>
              <div className="card-body" style={{ textAlign: 'center', padding: '40px 28px' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>💳</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Complete Your Payment</h2>
                <p style={{ color: 'var(--gray-500)', marginBottom: 8 }}>Order #{order.order_number} has been created.</p>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-700)', marginBottom: 32 }}>₹{order.total_amount?.toFixed(2)}</div>

                <div style={{ background: 'var(--accent-50)', border: '1px solid var(--accent-200)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--accent-800)' }}>Demo Payment Gateway</div>
                  <div style={{ fontSize: 13, color: 'var(--accent-700)', lineHeight: 1.6 }}>
                    This is a simulated payment for demonstration purposes. Click "Pay Now" to simulate a successful payment. In production, this would connect to Razorpay/Stripe.
                  </div>
                </div>

                <button
                  className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
                  style={{ minWidth: 200 }}
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {!loading && <><CreditCard size={18} /> Pay ₹{order.total_amount?.toFixed(2)}</>}
                </button>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-400)' }}>🔒 256-bit SSL encrypted payment</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
