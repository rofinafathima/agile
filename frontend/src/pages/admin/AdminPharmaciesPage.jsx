import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Star, Package, IndianRupee, ToggleLeft, ToggleRight, Search, RefreshCw, Mail, Shield } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CITIES = ['All', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [toggling, setToggling] = useState(null);

  useEffect(() => { loadPharmacies(); }, []);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pharmacies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPharmacies(data.pharmacies || []);
    } catch (err) {
      toast.error('Failed to load pharmacies.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, name) => {
    setToggling(id);
    try {
      const { data } = await api.put(`/admin/pharmacies/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(data.message);
      setPharmacies(prev => prev.map(p => p.id === id ? { ...p, is_active: data.is_active } : p));
    } catch (err) {
      toast.error('Failed to update pharmacy status.');
    } finally {
      setToggling(null);
    }
  };

  const filtered = pharmacies.filter(p => {
    const matchCity = cityFilter === 'All' || p.city?.toLowerCase().includes(cityFilter.toLowerCase());
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.pincode?.includes(search) || p.code?.toLowerCase().includes(search.toLowerCase());
    return matchCity && matchSearch;
  });

  const totalActive = pharmacies.filter(p => p.is_active).length;
  const totalOrders = pharmacies.reduce((s, p) => s + (p.total_orders || 0), 0);
  const totalRevenue = pharmacies.reduce((s, p) => s + (p.total_revenue || 0), 0);

  return (
    <div className="admin-content-inner">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ marginBottom: 4 }}>Pharmacy Partners</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Manage all partner pharmacies across cities</p>
        </div>
        <button onClick={loadPharmacies} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Partners', value: pharmacies.length, icon: <Store size={20} />, color: '#0ea5e9' },
          { label: 'Active Now', value: totalActive, icon: <Shield size={20} />, color: '#4ade80' },
          { label: 'Total Orders', value: totalOrders, icon: <Package size={20} />, color: '#fbbf24' },
          { label: 'Total Revenue', value: `\u20b9${Number(totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <IndianRupee size={20} />, color: '#818cf8' },
        ].map(stat => (
          <div key={stat.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name, code, pincode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: cityFilter === city ? 'var(--accent-500)' : 'var(--gray-100)',
                color: cityFilter === city ? 'white' : 'var(--gray-600)',
                border: cityFilter === city ? 'none' : '1px solid var(--gray-200)',
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Pharmacy Cards Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading pharmacies...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>No pharmacies found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filtered.map(pharmacy => (
            <div key={pharmacy.id} className="card" style={{ opacity: pharmacy.is_active ? 1 : 0.7, transition: 'all 0.2s' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="card-title" style={{ fontSize: 16 }}>{pharmacy.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: pharmacy.is_active ? '#dcfce7' : '#fee2e2',
                      color: pharmacy.is_active ? '#15803d' : '#dc2626',
                    }}>
                      {pharmacy.is_active ? '\u25cf ACTIVE' : '\u25cb INACTIVE'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, fontFamily: 'monospace' }}>{pharmacy.code}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{pharmacy.rating}</span>
                </div>
              </div>

              <div className="card-body" style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />
                    {pharmacy.address}, {pharmacy.city}, {pharmacy.state} \u2013 {pharmacy.pincode}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />
                    {pharmacy.phone}
                  </div>
                  {pharmacy.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={13} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />
                      {pharmacy.email}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    License: {pharmacy.license_number} \u00b7 Hours: {pharmacy.operating_hours || '9 AM \u2013 10 PM'}
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Total Orders', value: pharmacy.total_orders || 0, color: '#0ea5e9' },
                    { label: 'Active', value: pharmacy.active_orders || 0, color: '#fbbf24' },
                    { label: 'Revenue', value: `\u20b9${Number(pharmacy.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#4ade80' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Toggle Status */}
                <button
                  onClick={() => toggleStatus(pharmacy.id, pharmacy.name)}
                  disabled={toggling === pharmacy.id}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    background: pharmacy.is_active ? '#fee2e2' : '#dcfce7',
                    color: pharmacy.is_active ? '#dc2626' : '#15803d',
                    border: `1px solid ${pharmacy.is_active ? '#fca5a5' : '#86efac'}`,
                    transition: 'all 0.2s', opacity: toggling === pharmacy.id ? 0.6 : 1,
                  }}
                >
                  {pharmacy.is_active
                    ? <><ToggleRight size={16} /> Deactivate Pharmacy</>
                    : <><ToggleLeft size={16} /> Activate Pharmacy</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
