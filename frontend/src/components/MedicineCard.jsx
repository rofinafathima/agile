import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const MEDICINE_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function getStockInfo(stock, threshold) {
  if (stock <= 0) return { label: 'Out of Stock', cls: 'stock-out', dot: '🔴' };
  if (stock <= threshold) return { label: `Only ${stock} left`, cls: 'stock-low', dot: '🟡' };
  return { label: `In Stock (${stock} units)`, cls: 'stock-in', dot: '🟢' };
}

export default function MedicineCard({ medicine }) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = React.useState(false);

  const stockInfo = getStockInfo(medicine.stock_quantity, medicine.low_stock_threshold || 10);
  const discountedPrice = medicine.unit_price * (1 - (medicine.discount || 0) / 100);
  const imageUrl = medicine.image_url ? `${MEDICINE_BASE}${medicine.image_url}` : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to add to cart.');
      navigate('/login');
      return;
    }
    if (medicine.stock_quantity <= 0) {
      toast.error('This medicine is out of stock.');
      return;
    }
    setAdding(true);
    const minQty = medicine.individually_dispensable ? 1 : medicine.pack_size;
    const result = await addToCart(medicine.id, minQty);
    if (result.success) {
      toast.success(`${medicine.name} added to cart!`);
    } else {
      toast.error(result.error || 'Failed to add to cart.');
    }
    setAdding(false);
  };

  return (
    <div className="medicine-card animate-fadeIn">
      {/* Discount ribbon */}
      {medicine.discount > 0 && (
        <div className="discount-ribbon">{medicine.discount}% OFF</div>
      )}

      {/* Rx Badge */}
      {medicine.prescription_required ? (
        <div className="medicine-card-rx">Rx</div>
      ) : null}

      {/* Image */}
      <Link to={`/medicines/${medicine.id}`} className="medicine-card-image" style={{ display: 'block', textDecoration: 'none' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={medicine.name} />
        ) : (
          <span className="placeholder-icon">💊</span>
        )}
        {medicine.stock_quantity <= 0 && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14
          }}>
            Out of Stock
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="medicine-card-body">
        <Link to={`/medicines/${medicine.id}`} style={{ textDecoration: 'none' }}>
          <div className="medicine-card-name">{medicine.name}</div>
          {medicine.generic_name && <div className="medicine-card-generic">Generic: {medicine.generic_name}</div>}
          {medicine.brand && <div className="medicine-card-brand">{medicine.brand} · {medicine.manufacturer}</div>}
          {medicine.strength && <div className="medicine-card-strength">{medicine.strength} · {medicine.dosage_form}</div>}
        </Link>

        <div className="medicine-card-price-row">
          <span className="medicine-card-price">₹{discountedPrice.toFixed(2)}</span>
          {medicine.discount > 0 && (
            <span className="medicine-card-mrp">₹{medicine.mrp?.toFixed(2)}</span>
          )}
        </div>

        <div className="medicine-card-stock">
          <span className={stockInfo.cls}>{stockInfo.dot} {stockInfo.label}</span>
        </div>

        {medicine.prescription_required && (
          <div className="flex items-center gap-1 mb-2" style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
            <AlertTriangle size={12} /> Prescription Required
          </div>
        )}

        {!medicine.individually_dispensable && medicine.pack_size > 1 && (
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 8 }}>
            Sold in packs of {medicine.pack_size} {medicine.unit_type}
          </div>
        )}

        <div className="medicine-card-actions">
          <Link to={`/medicines/${medicine.id}`} className="btn btn-ghost btn-sm">
            <Eye size={14} /> Details
          </Link>
          <button
            className={`btn btn-primary btn-sm ${adding ? 'btn-loading' : ''}`}
            onClick={handleAddToCart}
            disabled={adding || medicine.stock_quantity <= 0}
          >
            <ShoppingCart size={14} />
            {medicine.stock_quantity <= 0 ? 'N/A' : adding ? '' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
