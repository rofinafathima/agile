import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertTriangle, CheckCircle, Package, Info, ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { medicinesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function StockBadge({ stock, threshold }) {
  if (stock <= 0) return <span className="badge badge-danger" style={{ fontSize: 13, padding: '6px 14px' }}>🔴 Out of Stock</span>;
  if (stock <= threshold) return <span className="badge badge-warning" style={{ fontSize: 13, padding: '6px 14px' }}>🟡 Low Stock — Only {stock} left</span>;
  return <span className="badge badge-success" style={{ fontSize: 13, padding: '6px 14px' }}>🟢 In Stock — {stock} units available</span>;
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
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    medicinesAPI.getById(id).then(({ data }) => {
      setMedicine(data.medicine);
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
      // Set default quantity
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
    { id: 'description', label: 'Description' },
    { id: 'uses', label: 'Uses' },
    { id: 'dosage', label: 'Dosage' },
    { id: 'side_effects', label: 'Side Effects' },
    { id: 'storage', label: 'Storage & Warnings' },
  ];

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
          {/* Left: Image + Key Info */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ height: 300, background: 'linear-gradient(135deg, var(--accent-50), var(--primary-50))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                {medicine.image_url ? <img src={`${BASE_URL}${medicine.image_url}`} alt={medicine.name} style={{ maxHeight: '100%', objectFit: 'contain' }} /> : '💊'}
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
          </div>

          {/* Right: Details + Purchase */}
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {medicine.prescription_required && (
                <span className="badge badge-purple"><AlertTriangle size={11} /> Prescription Required</span>
              )}
              {!medicine.prescription_required && (
                <span className="badge badge-success">OTC — No Prescription Needed</span>
              )}
              {medicine.discount > 0 && (
                <span className="badge badge-warning">{medicine.discount}% OFF</span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2, marginBottom: 6 }}>{medicine.name}</h1>
            {medicine.generic_name && <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>Generic: <strong>{medicine.generic_name}</strong></p>}
            {medicine.brand && <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Brand: <strong>{medicine.brand}</strong> by {medicine.manufacturer}</p>}

            {/* Stock */}
            <div style={{ marginBottom: 16 }}>
              <StockBadge stock={medicine.stock_quantity} threshold={medicine.low_stock_threshold || 10} />
            </div>

            {/* Price */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--gray-900)' }}>
                  ₹{discountedPrice.toFixed(2)}
                </span>
                <span style={{ fontSize: 14 }}>per {medicine.unit_type}</span>
                {medicine.discount > 0 && (
                  <span style={{ fontSize: 16, color: 'var(--gray-400)', textDecoration: 'line-through' }}>₹{medicine.mrp?.toFixed(2)}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                MRP: ₹{medicine.mrp?.toFixed(2)} {medicine.discount > 0 && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Save ₹{((medicine.mrp - discountedPrice) * quantity).toFixed(2)}</span>}
              </div>
            </div>

            {/* Quantity */}
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
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-700)' }}>
                    Total: ₹{(discountedPrice * quantity).toFixed(2)}
                  </span>
                </div>
                {!medicine.individually_dispensable && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-400)' }}>
                    ℹ️ This medicine is sold in sealed packs of {medicine.pack_size} {medicine.unit_type} only.
                  </div>
                )}
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

            {/* Add to Cart */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button
                className={`btn btn-primary btn-lg ${adding ? 'btn-loading' : ''}`}
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={adding || medicine.stock_quantity <= 0}
              >
                {!adding && <><ShoppingCart size={18} /> {medicine.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</>}
              </button>
              <Link to="/cart" className="btn btn-secondary btn-lg" style={{ flexShrink: 0 }}>
                Buy Now
              </Link>
            </div>

            {/* Delivery Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '🚚', label: 'Free delivery over ₹499' },
                { icon: '✅', label: '100% authentic medicines' },
                { icon: '↩️', label: 'Easy returns & refunds' },
                { icon: '🔒', label: 'Secure payment' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-50)', borderRadius: 8, padding: '8px 10px' }}>
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Uses, Dosage, etc. */}
        <div className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', overflowX: 'auto' }}>
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
                  color: activeTab === tab.id ? 'var(--accent-600)' : 'var(--gray-500)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-600)' : '2px solid transparent',
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
          <div style={{ padding: '24px 28px' }}>
            {activeTab === 'description' && (
              <div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--gray-700)', marginBottom: 20 }}>{medicine.description || 'No description available.'}</p>
                {medicine.composition && (
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--gray-800)' }}>Composition</h3>
                    <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{medicine.composition}</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'uses' && (
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--gray-800)' }}>Uses & Indications</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--gray-700)' }}>{medicine.uses || 'Information not available.'}</p>
              </div>
            )}
            {activeTab === 'dosage' && (
              <div>
                <div className="medical-disclaimer" style={{ marginBottom: 20 }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>Dosage information is for general reference only. Always follow your doctor's prescription and consult a qualified healthcare professional before taking any medication.</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--gray-700)' }}>{medicine.dosage_info || 'Dosage as prescribed by your physician.'}</p>
              </div>
            )}
            {activeTab === 'side_effects' && (
              <div>
                <div className="medical-disclaimer" style={{ marginBottom: 20 }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>Listed side effects may not occur in all patients. Contact your healthcare provider if you experience any adverse effects.</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--gray-700)' }}>{medicine.side_effects || 'No specific side effects listed.'}</p>
              </div>
            )}
            {activeTab === 'storage' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--gray-800)' }}>Storage Instructions</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--gray-600)' }}>{medicine.storage_instructions || 'Store in a cool, dry place below 30°C, away from children.'}</p>
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--gray-800)' }}>Warnings & Precautions</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--gray-600)' }}>{medicine.warnings || 'Please consult your doctor for complete precaution information.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="card" style={{ marginBottom: 40 }}>
            <div className="card-header">
              <span className="card-title">Customer Reviews</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontWeight: 700 }}>
                <Star size={16} fill="currentColor" /> {avgRating.toFixed(1)} / 5
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
