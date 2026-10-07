import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronDown, X, Search } from 'lucide-react';
import { medicinesAPI, categoriesAPI } from '../services/api';
import MedicineCard from '../components/MedicineCard';
import Footer from '../components/Footer';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name: A–Z' },
  { value: 'discount', label: 'Best Discount' },
];

export default function MedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || '',
    prescription: searchParams.get('prescription') || '',
    available: searchParams.get('available') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const fetchMedicines = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.search) params.search = f.search;
      if (f.category) params.category = f.category;
      if (f.sort) params.sort = f.sort;
      if (f.prescription) params.prescription = f.prescription;
      if (f.available) params.available = f.available;
      if (f.min_price) params.min_price = f.min_price;
      if (f.max_price) params.max_price = f.max_price;
      params.page = f.page;
      params.limit = 24;

      const { data } = await medicinesAPI.getAll(params);
      setMedicines(data.medicines);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Fetch medicines error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data.categories)).catch(console.error);
  }, []);

  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      sort: searchParams.get('sort') || '',
      prescription: searchParams.get('prescription') || '',
      available: searchParams.get('available') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      page: parseInt(searchParams.get('page') || '1'),
    };
    setFilters(newFilters);
    fetchMedicines(newFilters);
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearFilter = (key) => updateFilter(key, '');

  const clearAllFilters = () => setSearchParams({});

  const setPage = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
  };

  const activeFilterCount = [filters.category, filters.prescription, filters.available, filters.min_price, filters.max_price].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="card" style={{ position: 'sticky', top: 90, borderRadius: 16 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Filters</span>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 12 }}>
            Clear All
          </button>
        )}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {/* Category */}
        <div className="filter-section">
          <div className="filter-title">Category</div>
          <select className="form-select" style={{ fontSize: 13 }} value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        {/* Availability */}
        <div className="filter-section">
          <div className="filter-title">Availability</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={filters.available === 'true'} onChange={e => updateFilter('available', e.target.checked ? 'true' : '')} />
            In Stock Only
          </label>
        </div>

        {/* Prescription */}
        <div className="filter-section">
          <div className="filter-title">Prescription</div>
          {[{ value: '', label: 'All' }, { value: 'false', label: 'OTC Only' }, { value: 'true', label: 'Rx Required' }].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginBottom: 6 }}>
              <input type="radio" name="prescription" value={opt.value} checked={filters.prescription === opt.value} onChange={() => updateFilter('prescription', opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>

        {/* Price Range */}
        <div className="filter-section">
          <div className="filter-title">Price Range (₹)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" className="form-input" placeholder="Min" style={{ fontSize: 12 }} value={filters.min_price} onChange={e => updateFilter('min_price', e.target.value)} min={0} />
            <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>–</span>
            <input type="number" className="form-input" placeholder="Max" style={{ fontSize: 12 }} value={filters.max_price} onChange={e => updateFilter('max_price', e.target.value)} min={0} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 className="page-title">{filters.search ? `Results for "${filters.search}"` : filters.category ? `${categories.find(c => c.slug === filters.category)?.name || ''} Medicines` : 'All Medicines'}</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
            {loading ? 'Loading...' : `${pagination.total || 0} medicines found`}
          </p>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {filters.category && <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 12 }}>{categories.find(c => c.slug === filters.category)?.name} <button onClick={() => clearFilter('category')} style={{ background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer', color: 'inherit' }}>×</button></span>}
            {filters.available === 'true' && <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 12 }}>In Stock <button onClick={() => clearFilter('available')} style={{ background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer', color: 'inherit' }}>×</button></span>}
            {filters.prescription && <span className="badge badge-warning" style={{ padding: '6px 12px', fontSize: 12 }}>{filters.prescription === 'true' ? 'Rx Required' : 'OTC'} <button onClick={() => clearFilter('prescription')} style={{ background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer', color: 'inherit' }}>×</button></span>}
          </div>
        )}

        {/* Sort & Filter Toggle Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <SlidersHorizontal size={14} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Sort by:</span>
            <select className="form-select" style={{ width: 'auto', fontSize: 13, padding: '8px 12px' }} value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* Filter Sidebar */}
          <div style={{ width: 240, flexShrink: 0, display: showFilters ? 'block' : 'none' }}>
            <FilterPanel />
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="medicines-grid">
                {[...Array(12)].map((_, i) => <div key={i} className="loading-skeleton" style={{ height: 340, borderRadius: 16 }} />)}
              </div>
            ) : medicines.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No medicines found</div>
                <div className="empty-state-text">Try adjusting your search or filters to find what you're looking for.</div>
                <button onClick={clearAllFilters} className="btn btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="medicines-grid">
                  {medicines.map(med => <MedicineCard key={med.id} medicine={med} />)}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                    <button className="btn btn-ghost btn-sm" disabled={filters.page <= 1} onClick={() => setPage(filters.page - 1)}>← Previous</button>
                    {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          className={`btn btn-sm ${filters.page === p ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setPage(p)}
                          style={{ minWidth: 36 }}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button className="btn btn-ghost btn-sm" disabled={filters.page >= pagination.totalPages} onClick={() => setPage(filters.page + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
