import React, { useState, useEffect } from 'react';
import { User, MapPin, FileText, Lock, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI, addressesAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile Form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', date_of_birth: user?.date_of_birth || '' });
  
  // Password Form
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState(null);

  useEffect(() => {
    if (activeTab === 'addresses') fetchAddresses();
  }, [activeTab]);

  const fetchAddresses = async () => {
    try {
      const { data } = await addressesAPI.getAll();
      setAddresses(data.addresses);
    } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (addrForm.id) await addressesAPI.update(addrForm.id, addrForm);
      else await addressesAPI.add({ ...addrForm, is_default: addresses.length === 0 });
      toast.success('Address saved');
      setAddrForm(null);
      fetchAddresses();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save address'); }
    finally { setLoading(false); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressesAPI.delete(id);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (err) { toast.error('Failed to delete address'); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <h1 className="page-title" style={{ marginBottom: 28 }}>My Account</h1>

        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar card" style={{ padding: 12 }}>
            <button className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><User size={18} /> Personal Info</button>
            <button className={`profile-nav-item ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}><MapPin size={18} /> Saved Addresses</button>
            <button className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}><Lock size={18} /> Security</button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeTab === 'profile' && (
              <div className="card animate-fadeIn">
                <div className="card-header"><span className="card-title">Personal Information</span></div>
                <div className="card-body">
                  <form onSubmit={handleUpdateProfile} style={{ maxWidth: 500 }}>
                    <div className="form-group">
                      <label className="form-label">Email (Cannot be changed)</label>
                      <input className="form-input" value={user?.email} disabled style={{ background: 'var(--gray-100)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} maxLength={10} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input className="form-input" type="date" value={profileForm.date_of_birth} onChange={e => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} />
                    </div>
                    <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} disabled={loading}>Save Changes</button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card animate-fadeIn">
                <div className="card-header"><span className="card-title">Change Password</span></div>
                <div className="card-body">
                  <form onSubmit={handleChangePassword} style={{ maxWidth: 500 }}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input className="form-input" type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input className="form-input" type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input className="form-input" type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} required />
                    </div>
                    <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} disabled={loading}>Update Password</button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="animate-fadeIn">
                {!addrForm ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => setAddrForm({ label: 'Home', full_name: user?.name || '', phone: user?.phone || '', address_line1: '', city: '', state: '', pincode: '' })}>
                        <Plus size={16} /> Add New Address
                      </button>
                    </div>
                    {addresses.length === 0 ? (
                      <div className="empty-state card">
                        <MapPin size={40} style={{ color: 'var(--gray-300)', marginBottom: 16 }} />
                        <div className="empty-state-title">No saved addresses</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {addresses.map(addr => (
                          <div key={addr.id} className="card">
                            <div className="card-body">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{addr.full_name} <span className="badge badge-gray">{addr.label}</span></div>
                                {addr.is_default && <span className="badge badge-success">Default</span>}
                              </div>
                              <div style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 12 }}>
                                {addr.address_line1}<br />
                                {addr.city}, {addr.state} - {addr.pincode}<br />
                                📱 {addr.phone}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setAddrForm(addr)}><Edit2 size={14} /> Edit</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteAddress(addr.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /> Delete</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="card animate-slideUp">
                    <div className="card-header"><span className="card-title">{addrForm.id ? 'Edit Address' : 'Add New Address'}</span></div>
                    <div className="card-body">
                      <form onSubmit={handleSaveAddress} className="grid-2">
                        <div className="form-group"><label className="form-label">Label</label>
                          <select className="form-select" value={addrForm.label} onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}>
                            <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group"><label className="form-label">Full Name *</label>
                          <input className="form-input" value={addrForm.full_name} onChange={e => setAddrForm({ ...addrForm, full_name: e.target.value })} required />
                        </div>
                        <div className="form-group"><label className="form-label">Phone *</label>
                          <input className="form-input" value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} required />
                        </div>
                        <div className="form-group"><label className="form-label">Pincode *</label>
                          <input className="form-input" value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Address Line 1 *</label>
                          <input className="form-input" value={addrForm.address_line1} onChange={e => setAddrForm({ ...addrForm, address_line1: e.target.value })} required />
                        </div>
                        <div className="form-group"><label className="form-label">City *</label>
                          <input className="form-input" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} required />
                        </div>
                        <div className="form-group"><label className="form-label">State *</label>
                          <input className="form-input" value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} required />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginTop: 12 }}>
                          <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} disabled={loading}>Save Address</button>
                          <button type="button" className="btn btn-ghost" onClick={() => setAddrForm(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
