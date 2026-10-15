import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, AlertTriangle, CheckCircle, Package, Info, ChevronRight,
  Minus, Plus, Star, ShieldAlert, Clock, Pill, Thermometer,
  Stethoscope, AlertCircle, FileText, Check
} from 'lucide-react';
import { medicinesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function StockBadge({ stock, threshold }) {
  if (stock <= 0) return <span className="badge badge-danger" style={{ fontSize: 13, padding: '6px 14px' }}>🔴 Out of Stock</span>;
  if (stock <= threshold) return <span className="badge badge-warning" style={{ fontSize: 13, padding: '6px 14px' }}>🟡 Low Stock</span>;
  return <span className="badge badge-success" style={{ fontSize: 13, padding: '6px 14px' }}>🟢 In Stock</span>;
}

export default function MedicineDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('dosage');

  useEffect(() => {
    setLoading(true);
    medicinesAPI.getById(id).then(({ data }) => {
      setMedicine(data.medicine);
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
      const med = data.medicine;
      if (!med.individually_dispensable) {
        setQuantity(med.pack_size);
      } else {
        setQuantity(med.min_order_quantity || 1);
      }
    }).catch(err => {
      if (err.response?.status === 404) navigate('/medicines');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-wrapper page-container" style={{ paddingTop: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32 }}>
        <div className="loading-skeleton" style={{ height: 380, borderRadius: 16 }} />
        <div>
          {[...Array(5)].map((_, i) => <div key={i} className="loading-skeleton" style={{ height: 24, borderRadius: 8, marginBottom: 16, width: `${[80, 60, 100, 40, 70][i]}%` }} />)}
        </div>
      </div>
    </div>
  );

  if (!medicine) return null;

  const discountedPrice = medicine.unit_price * (1 - (medicine.discount || 0) / 100);
  const minQty = medicine.individually_dispensable ? (medicine.min_order_quantity || 1) : medicine.pack_size;
  const maxQty = Math.min(medicine.max_order_quantity || 100, medicine.stock_quantity || 0);
  const step = medicine.individually_dispensable ? 1 : medicine.pack_size;

  const adjustQty = (delta) => {
    const newQty = quantity + delta * step;
    if (newQty >= minQty && newQty <= maxQty) setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login first.'); navigate('/login'); return; }
    if (medicine.stock_quantity <= 0) { toast.error('Out of stock.'); return; }
    setAdding(true);
    const result = await addToCart(medicine.id, quantity);
    if (result.success) toast.success(`${medicine.name} added to cart!`);
    else toast.error(result.error);
    setAdding(false);
  };

  const tabs = [
    { id: 'dosage', label: '💊 Dosage & Usage' },
    { id: 'uses', label: '🎯 Uses & Benefits' },
    { id: 'safety', label: '🛡️ Safety & Precautions' },
    { id: 'side_effects', label: '⚠️ Side Effects' },
    { id: 'storage', label: '🌡️ Storage & Info' },
  ];

  const usesList = medicine.uses ? medicine.uses.split(',').map(u => u.trim()).filter(Boolean) : [];
  const sideEffectsList = medicine.side_effects ? medicine.side_effects.split('.').flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13, color: 'var(--gray-400)' }}>
          <Link to="/" style={{ color: 'var(--accent-600)' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/medicines" style={{ color: 'var(--accent-600)' }}>Medicines</Link>
          <ChevronRight size={14} />
          {medicine.category_name && <><Link to={`/medicines?category=${medicine.category_slug}`} style={{ color: 'var(--accent-600)' }}>{medicine.category_name}</Link><ChevronRight size={14} /></>}
          <span className="truncate" style={{ color: 'var(--gray-600)' }}>{medicine.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }} className="detail-grid">
          {/* Left: Image + Key Specifications */}
          <div>
            <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ height: 340, background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, overflow: 'hidden' }}>
                {medicine.image_url ? (
                  <img
                    src={medicine.image_url.startsWith('http') ? medicine.image_url : `${BASE_URL}${medicine.image_url}`}
                    alt={medicine.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : '💊'}
              </div>
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Form', value: medicine.dosage_form },
                    { label: 'Strength', value: medicine.strength },
                    { label: 'Pack Size', value: `${medicine.pack_size} ${medicine.unit_type}` },
                    { label: 'Manufacturer', value: medicine.manufacturer },
                  ].map(item => item.value && (
                    <div key={item.label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginTop: 2 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Storage & Composition Card */}
            <div className="card" style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 700, fontSize: 14, color: '#334155' }}>
                <Pill size={16} className="text-accent" /> Active Composition
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 14 }}>
                {medicine.composition || 'Standard pharmaceutical grade formulation'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontWeight: 700, fontSize: 14, color: '#334155' }}>
                <Thermometer size={16} style={{ color: '#0284c7' }} /> Storage Instructions
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {medicine.storage_instructions || 'Store below 30°C in a dry place. Protect from direct light.'}
              </p>
            </div>
          </div>

          {/* Right: Details, Purchase & Dosage Quick Summary */}
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {medicine.prescription_required ? (
                <span className="badge badge-purple"><AlertTriangle size={11} /> Prescription Required</span>
              ) : (
                <span className="badge badge-success">OTC — No Prescription Needed</span>
              )}
              {medicine.discount > 0 && (
                <span className="badge badge-warning">{medicine.discount}% OFF</span>
              )}
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2, marginBottom: 6 }}>{medicine.name}</h1>
            {medicine.generic_name && <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>Generic: <strong style={{ color: 'var(--gray-800)' }}>{medicine.generic_name}</strong></p>}
            {medicine.brand && <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Brand: <strong style={{ color: 'var(--gray-800)' }}>{medicine.brand}</strong> by {medicine.manufacturer}</p>}

            {/* Stock */}
            <div style={{ marginBottom: 16 }}>
              <StockBadge stock={medicine.stock_quantity} />
            </div>

            {/* Price Card */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--gray-900)' }}>
                  ₹{discountedPrice.toFixed(2)}
                </span>
                <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>per {medicine.unit_type}</span>
                {medicine.discount > 0 && (
                  <span style={{ fontSize: 16, color: 'var(--gray-400)', textDecoration: 'line-through' }}>₹{medicine.mrp?.toFixed(2)}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                MRP: ₹{medicine.mrp?.toFixed(2)} {medicine.discount > 0 && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Save ₹{((medicine.mrp - discountedPrice) * quantity).toFixed(2)}</span>}
              </div>
            </div>

            {/* Prominent Dosage & Direction Highlight Box */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 6 }}>
                <Clock size={18} /> Recommended Dosage & Usage
              </div>
              <p style={{ fontSize: 14, color: '#15803d', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {medicine.dosage_info || 'Take strictly as directed by your physician or healthcare professional.'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={{ background: '#white', color: '#166534', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🍽️ Take after meals
                </span>
                <span style={{ background: 'white', color: '#0369a1', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #7dd3fc', display: 'flex', alignItems: 'center', gap: 4 }}>
                  💧 Swallow with water
                </span>
                <span style={{ background: 'white', color: '#b45309', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #fde047', display: 'flex', alignItems: 'center', gap: 4 }}>
                  👨‍⚕️ Follow doctor prescription
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {medicine.stock_quantity > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 10 }}>
                  Select Quantity
                  {!medicine.individually_dispensable && (
                    <span style={{ fontSize: 12, color: 'var(--warning)', marginLeft: 8, fontWeight: 500 }}>
                      (Must order in packs of {medicine.pack_size})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="qty-selector">
                    <button className="qty-btn" onClick={() => adjustQty(-1)} disabled={quantity <= minQty}>
                      <Minus size={14} />
                    </button>
                    <input
                      className="qty-input"
                      type="number"
                      value={quantity}
                      readOnly
                      style={{ width: 60 }}
                    />
                    <button className="qty-btn" onClick={() => adjustQty(1)} disabled={quantity >= maxQty}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{medicine.unit_type}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-700)' }}>
                    Total: ₹{(discountedPrice * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Prescription Warning */}
            {medicine.prescription_required && (
              <div className="medical-disclaimer" style={{ marginBottom: 16 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Prescription Required.</strong> You will need to upload a valid prescription to complete your purchase. Our pharmacist will verify it before dispensing.
                </div>
              </div>
            )}

            {/* Add to Cart Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button
                className={`btn btn-primary btn-lg ${adding ? 'btn-loading' : ''}`}
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={adding || medicine.stock_quantity <= 0}
              >
                {!adding && <><ShoppingCart size={18} /> {medicine.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</>}
              </button>
              <button
                className="btn btn-secondary btn-lg"
                style={{ flexShrink: 0 }}
                onClick={async () => {
                  await handleAddToCart();
                  navigate('/cart');
                }}
                disabled={medicine.stock_quantity <= 0}
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Guarantees */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '🚚', label: 'Express Delivery Available' },
                { icon: '✅', label: '100% Genuine Medicine' },
                { icon: '↩️', label: 'Hassle-free Returns' },
                { icon: '🔒', label: 'Secure Checkout' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-600)', background: 'var(--gray-50)', borderRadius: 8, padding: '8px 10px' }}>
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Information Section with Tabs */}
        <div className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto', background: '#fafafa' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  background: 'none',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--accent-600)' : 'var(--gray-600)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--accent-600)' : '3px solid transparent',
                  marginBottom: -1,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Tab 1: Dosage & Administration */}
            {activeTab === 'dosage' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock className="text-accent" size={20} /> Dosage & Administration Guidelines
                </h3>

                <div className="medical-disclaimer" style={{ marginBottom: 20 }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>Always follow your doctor's exact instructions regarding dosage and treatment duration. Do not adjust dosage without consulting a medical professional.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Stethoscope size={16} /> How to Take {medicine.name}
                    </h4>
                    <p style={{ fontSize: 14, color: '#15803d', lineHeight: 1.7, margin: 0 }}>
                      {medicine.dosage_info || 'Take this medicine in the dose and duration as advised by your doctor.'}
                    </p>
                  </div>

                  <div style={{ background: '#eff6ff', padding: 20, borderRadius: 12, border: '1px solid #bfdbfe' }}>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: '#1e40af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={16} /> Missed Dose Instruction
                    </h4>
                    <p style={{ fontSize: 14, color: '#1d4ed8', lineHeight: 1.7, margin: 0 }}>
                      If you miss a dose, take it as soon as remembered. If it is close to the time of your next dose, skip the missed dose and resume your normal schedule. Do not double the dose.
                    </p>
                  </div>
                </div>

                <div style={{ background: 'var(--gray-50)', padding: 18, borderRadius: 10 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)', marginBottom: 8 }}>Key Recommendations</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.8 }}>
                    <li>Swallow tablets or capsules whole with a full glass of water. Do not crush, chew, or break unless instructed.</li>
                    <li>Try to take your medication at the same time each day to maintain steady levels in your body.</li>
                    <li>Complete the full course prescribed by your doctor even if your symptoms improve early.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Uses & Indications */}
            {activeTab === 'uses' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill className="text-accent" size={20} /> Therapeutic Uses & Benefits
                </h3>

                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--gray-700)', marginBottom: 20 }}>
                  {medicine.description}
                </p>

                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--gray-800)' }}>Primary Indications</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {usesList.length > 0 ? (
                    usesList.map((use, idx) => (
                      <div key={idx} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '8px 14px', borderRadius: 20, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={14} /> {use}
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>{medicine.uses || 'Consult your doctor for specific indications.'}</span>
                  )}
                </div>

                {medicine.composition && (
                  <div style={{ background: 'var(--gray-50)', padding: 18, borderRadius: 10 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)', marginBottom: 6 }}>Active Ingredients</h4>
                    <p style={{ fontSize: 14, color: 'var(--gray-700)', margin: 0 }}>{medicine.composition}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Safety & Precautions */}
            {activeTab === 'safety' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert className="text-warning" size={20} /> Safety Advice & Warnings
                </h3>

                {medicine.warnings && (
                  <div className="medical-disclaimer" style={{ marginBottom: 24 }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                      <strong>Important Warning:</strong> {medicine.warnings}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { title: '🍷 Alcohol', desc: 'Avoid or restrict alcohol consumption while taking this medication as it may increase adverse effects.' },
                    { title: '🤰 Pregnancy', desc: 'Consult your doctor before using this medicine if you are pregnant, planning to conceive, or breastfeeding.' },
                    { title: '🚗 Driving & Machinery', desc: medicine.warnings?.toLowerCase().includes('drowsiness') ? 'May cause drowsiness or dizziness. Avoid driving or operating heavy machinery.' : 'Generally does not impair driving ability unless dizziness occurs.' },
                    { title: '🫘 Liver & Kidney Conditions', desc: 'Inform your physician if you have pre-existing liver or kidney diseases for dosage adjustments.' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 16, border: '1px solid var(--gray-200)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)', marginBottom: 6 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Side Effects */}
            {activeTab === 'side_effects' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle style={{ color: '#eab308' }} size={20} /> Possible Side Effects
                </h3>

                <div className="medical-disclaimer" style={{ marginBottom: 20 }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>Most side effects do not require medical attention and disappear as your body adjusts to the medicine. Consult your doctor if they persist.</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)', marginBottom: 12 }}>Reported Symptoms</h4>
                  {sideEffectsList.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {sideEffectsList.map((effect, idx) => (
                        <div key={idx} style={{ background: '#fffbeb', border: '1px solid #fef08a', color: '#b45309', padding: '10px 14px', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={15} /> {effect}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: 'var(--gray-700)' }}>{medicine.side_effects || 'Generally well tolerated. No major side effects commonly reported.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: Storage & Manufacturer Info */}
            {activeTab === 'storage' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText className="text-accent" size={20} /> Storage & Product Metadata
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 12 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Thermometer size={16} /> Storage Guidelines
                    </h4>
                    <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, margin: 0 }}>
                      {medicine.storage_instructions || 'Store in a cool, dry place away from direct heat and sunlight. Keep out of reach of children and pets.'}
                    </p>
                  </div>

                  <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 12 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={16} /> Packaging & Manufacturer
                    </h4>
                    <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, margin: 0 }}>
                      <strong>Manufacturer:</strong> {medicine.manufacturer}<br />
                      <strong>Dosage Form:</strong> {medicine.dosage_form}<br />
                      <strong>Pack Size:</strong> {medicine.pack_size} {medicine.unit_type}<br />
                      <strong>Dispensing:</strong> {medicine.individually_dispensable ? 'Individual units allowed' : 'Full pack required'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        {reviews.length > 0 && (
          <div className="card" style={{ marginBottom: 40 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Customer Reviews & Ratings</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontWeight: 700, fontSize: 16 }}>
                <Star size={18} fill="currentColor" /> {avgRating.toFixed(1)} / 5
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-700)', fontSize: 14 }}>
                      {r.user_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.user_name}</div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? 'var(--warning)' : 'var(--gray-200)'} stroke="none" />)}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@media(max-width:768px){.detail-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
