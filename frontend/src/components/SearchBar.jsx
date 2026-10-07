import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { medicinesAPI } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function SearchBar({ onSearch, placeholder = 'Search medicines, brands...' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await medicinesAPI.search(query);
        setSuggestions(data.medicines?.slice(0, 6) || []);
        setShowDropdown(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleSelect = (medicine) => {
    navigate(`/medicines/${medicine.id}`);
    setQuery('');
    setShowDropdown(false);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return '🔴 Out of stock';
    if (stock <= 10) return '🟡 Low stock';
    return '🟢 In stock';
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSearch}>
        <div className="input-wrapper">
          <Search size={16} className="input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            autoComplete="off"
            style={{ borderRadius: '9999px', paddingLeft: 40, fontSize: 14 }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setShowDropdown(false); }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowDropdown(false)} />
          <div className="search-dropdown animate-slideDown" style={{ zIndex: 99 }}>
            {loading && (
              <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gray-400)' }}>Searching...</div>
            )}
            {suggestions.map((med) => (
              <button
                key={med.id}
                className="search-suggestion"
                onClick={() => handleSelect(med)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--gray-200)' }}>
                  {med.image_url ? (
                    <img
                      src={med.image_url.startsWith('http') ? med.image_url : `${BASE_URL}${med.image_url}`}
                      alt={med.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 16 }}>💊</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="search-suggestion-label">{med.name}</div>
                  <div className="search-suggestion-sub">
                    {med.generic_name && `${med.generic_name} · `}{med.brand && `${med.brand} · `}{getStockStatus(med.stock_quantity)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', flexShrink: 0 }}>
                  ₹{med.unit_price?.toFixed(2)}
                </div>
              </button>
            ))}
            <button
              onClick={handleSearch}
              style={{ width: '100%', padding: '10px 16px', background: 'var(--accent-50)', border: 'none', borderTop: '1px solid var(--gray-100)', cursor: 'pointer', fontSize: 13, color: 'var(--accent-700)', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Search size={14} />
              View all results for "{query}"
            </button>
          </div>
        </>
      )}
    </div>
  );
}
