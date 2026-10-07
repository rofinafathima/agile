import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, ChevronRight, Shield, Truck, Clock, Star, ArrowRight } from 'lucide-react';
import { categoriesAPI, medicinesAPI } from '../services/api';
import MedicineCard from '../components/MedicineCard';
import Footer from '../components/Footer';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredMedicines, setFeaturedMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      categoriesAPI.getAll(),
      medicinesAPI.getAll({ limit: 12, sort: 'newest' })
    ]).then(([catRes, medRes]) => {
      setCategories(catRes.data.categories);
      setFeaturedMedicines(medRes.data.medicines);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const features = [
    { icon: Shield, title: '100% Authentic', desc: 'All medicines sourced from certified manufacturers' },
    { icon: Truck, title: 'Fast Delivery', desc: 'Delivered to your doorstep within 2-5 business days' },
    { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock customer support for your queries' },
    { icon: Star, title: 'Trusted Platform', desc: 'Thousands of satisfied customers across India' },
  ];

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 9999, padding: '6px 16px', marginBottom: 24, color: 'var(--accent-400)', fontSize: 13, fontWeight: 600 }}>
                ✅ India's Trusted Online Pharmacy
              </div>
              <h1 className="hero-title">
                Your Medicines,<br />
                <span>Delivered Safely</span><br />
                to Your Doorstep
              </h1>
              <p className="hero-subtitle">
                Search from 1000+ authentic medicines. Order online with prescription verification, secure payments, and fast delivery.
              </p>
              <div className="hero-actions">
                <Link to="/medicines" className="btn btn-primary btn-lg">
                  Shop Medicines <ArrowRight size={18} />
                </Link>
                <Link to="/upload-prescription" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  <Upload size={18} /> Upload Prescription
                </Link>
              </div>

              {/* Hero search */}
              <form onSubmit={handleHeroSearch} className="hero-search" style={{ marginTop: 32 }}>
                <Search size={18} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search medicines, e.g. 'Paracetamol', 'Metformin'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: '10px 20px', flexShrink: 0 }}>
                  Search
                </button>
              </form>
            </div>

            {/* Floating stats */}
            <div className="hide-sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { value: '10,000+', label: 'Medicines', icon: '💊' },
                { value: '50,000+', label: 'Happy Customers', icon: '😊' },
                { value: '24/7', label: 'Support', icon: '🎧' },
                { value: '100%', label: 'Authentic', icon: '✅' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(10px)' }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="page-container" style={{ padding: '32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={22} style={{ color: 'var(--accent-600)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Browse by <span>Category</span></h2>
            <Link to="/categories" className="btn btn-ghost btn-sm">View All <ChevronRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="categories-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="loading-skeleton" style={{ height: 100, borderRadius: 12 }} />
              ))}
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map(cat => (
                <Link key={cat.id} to={`/medicines?category=${cat.slug}`} className="category-card">
                  <span className="category-icon">{cat.icon}</span>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat.medicine_count} items</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Medicines */}
      <section style={{ paddingBottom: 60 }}>
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Featured <span>Medicines</span></h2>
            <Link to="/medicines" className="btn btn-ghost btn-sm">View All <ChevronRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="medicines-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="loading-skeleton" style={{ height: 340, borderRadius: 16 }} />
              ))}
            </div>
          ) : (
            <div className="medicines-grid">
              {featuredMedicines.map(med => <MedicineCard key={med.id} medicine={med} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ margin: '0 0 60px' }}>
        <div className="page-container">
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-800), #1a3a3a)',
            borderRadius: 24,
            padding: '48px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(20,184,166,0.1)', borderRadius: '50%' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                Need Prescription Medicines?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 0 }}>
                Upload your prescription and we'll verify it with our licensed pharmacists.
              </p>
            </div>
            <Link to="/upload-prescription" className="btn btn-primary btn-lg" style={{ flexShrink: 0 }}>
              <Upload size={18} /> Upload Prescription
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`@media (max-width: 768px) { .hide-sm { display: none; } }`}</style>
    </div>
  );
}
