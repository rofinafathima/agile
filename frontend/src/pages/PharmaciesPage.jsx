import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Award, Search, CheckCircle, Navigation, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { pharmaciesAPI } from '../services/api';

const CITIES = ['All', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const res = await pharmaciesAPI.getAll();
      setPharmacies(res.data.pharmacies || []);
    } catch (err) {
      console.error('Failed to load pharmacies', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(p => {
    const matchesCity = selectedCity === 'All' || p.city.toLowerCase() === selectedCity.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      p.city.toLowerCase().includes(q) || 
      p.address.toLowerCase().includes(q) || 
      p.pincode.includes(q);
    return matchesCity && matchesSearch;
  });

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: 20,
          padding: '40px 32px',
          color: 'white',
          marginBottom: 36,
          boxShadow: '0 12px 32px rgba(2, 132, 199, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <ShieldCheck size={16} /> 100% Licensed & Verified Partner Network
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2, color: 'white' }}>
              Nearby Partner Pharmacies
            </h1>
            <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.5, margin: 0 }}>
              Your orders are automatically matched to the nearest licensed pharmacy in your neighborhood for rapid dispatch, strict cold-chain handling, and authentic medicines.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 16,
            marginTop: 28,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>15+</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Metro Hub Stores</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>⭐ 4.85</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Average Rating</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>2 - 4 Hrs</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Local Express Delivery</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>100%</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Authentic Medications</div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* City Tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 24,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    borderColor: selectedCity === city ? 'var(--accent-600)' : 'var(--gray-200)',
                    background: selectedCity === city ? 'var(--accent-600)' : 'white',
                    color: selectedCity === city ? 'white' : 'var(--gray-700)',
                    boxShadow: selectedCity === city ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                  }}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search area, city or pincode..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 12,
                  border: '1px solid var(--gray-200)',
                  background: 'white',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Pharmacy Cards Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-skeleton" style={{ height: 220, borderRadius: 16 }} />
            ))}
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--gray-100)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--gray-800)' }}>No pharmacies found</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Try adjusting your search query or city filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 24 }}>
            {filteredPharmacies.map(pharmacy => (
              <div
                key={pharmacy.id}
                className="card"
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '1px solid var(--gray-200)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Header */}
                <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 8px' }}>
                        Verified Store
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>{pharmacy.city}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
                      {pharmacy.name}
                    </h3>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: '#fef3c7', color: '#b45309',
                    padding: '4px 8px', borderRadius: 10,
                    fontSize: 12, fontWeight: 800, flexShrink: 0
                  }}>
                    ⭐ {pharmacy.rating}
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
                    <MapPin size={16} style={{ color: 'var(--gray-400)', marginTop: 2, flexShrink: 0 }} />
                    <span>{pharmacy.address}, {pharmacy.city} — <strong>{pharmacy.pincode}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                    <Phone size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                    <a href={`tel:${pharmacy.phone}`} style={{ color: 'var(--accent-600)', fontWeight: 600, textDecoration: 'none' }}>
                      {pharmacy.phone}
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-400)' }}>
                    <Award size={15} style={{ flexShrink: 0 }} />
                    <span>Drug Lic: <span style={{ fontFamily: 'monospace', color: 'var(--gray-600)' }}>{pharmacy.license_number}</span></span>
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{
                  padding: '12px 20px',
                  background: 'var(--gray-50)',
                  borderTop: '1px solid var(--gray-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                    <Clock size={13} /> Open · Express Dispatch
                  </div>
                  <Link
                    to="/medicines"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--accent-600)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Browse Medicines →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
