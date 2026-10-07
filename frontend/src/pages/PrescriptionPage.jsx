import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prescriptionsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function PrescriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ patient_name: user?.name || '', doctor_name: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    prescriptionsAPI.getAll()
      .then(r => setPrescriptions(r.data.prescriptions))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selected.type)) { toast.error('Only JPG, PNG and PDF allowed'); return; }
      setFile(selected);
    }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(dropped.type)) { toast.error('Only JPG, PNG and PDF allowed'); return; }
      setFile(dropped);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!formData.patient_name) { toast.error('Patient name is required'); return; }

    setLoading(true);
    const data = new FormData();
    data.append('prescription', file);
    data.append('patient_name', formData.patient_name);
    if (formData.doctor_name) data.append('doctor_name', formData.doctor_name);
    if (formData.notes) data.append('notes', formData.notes);

    try {
      const { data: res } = await prescriptionsAPI.upload(data);
      toast.success('Prescription uploaded successfully!');
      setPrescriptions([res.prescription, ...prescriptions]);
      setFile(null);
      setFormData({ patient_name: user?.name || '', doctor_name: '', notes: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ paddingTop: 28, paddingBottom: 60, maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 28 }}>Upload Prescription</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
          <div>
            <div className="card animate-fadeIn">
              <div className="card-header"><span className="card-title">Upload New Prescription</span></div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* File Upload Zone */}
                  <div
                    className="upload-zone"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                    style={{ marginBottom: 24, cursor: file ? 'default' : 'pointer' }}
                  >
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <FileText size={24} style={{ color: 'var(--accent-500)' }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <Upload className="upload-zone-icon" />
                        <div className="upload-zone-text">Click or drag file to upload</div>
                        <div className="upload-zone-sub">Supported formats: JPG, PNG, PDF (Max 5MB)</div>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                  </div>

                  {/* Form Fields */}
                  <div className="form-group">
                    <label className="form-label">Patient Name <span className="required">*</span></label>
                    <input className="form-input" value={formData.patient_name} onChange={e => setFormData({ ...formData, patient_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Doctor Name (Optional)</label>
                    <input className="form-input" value={formData.doctor_name} onChange={e => setFormData({ ...formData, doctor_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Additional Notes (Optional)</label>
                    <textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ minHeight: 80 }} />
                  </div>

                  <button type="submit" className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`} disabled={loading || !file}>
                    Submit Prescription
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Guidelines</span></div>
              <div className="card-body">
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--gray-600)' }}>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} /> Ensure doctor's details and signature are clearly visible.</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} /> Patient name and date of prescription must be clear.</li>
                  <li style={{ display: 'flex', gap: 8 }}><AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} /> Uploads are verified by pharmacists before order confirmation.</li>
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Recent Uploads</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                {loadingHistory ? (
                  <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner-sm" style={{ margin: '0 auto' }} /></div>
                ) : prescriptions.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>No past prescriptions found.</div>
                ) : (
                  prescriptions.slice(0, 3).map(rx => (
                    <div key={rx.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Prescription #{rx.id}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', margin: '4px 0' }}>{new Date(rx.created_at).toLocaleDateString()}</div>
                      <span className={`badge ${rx.status === 'approved' ? 'badge-success' : rx.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{rx.status}</span>
                    </div>
                  ))
                )}
                {prescriptions.length > 3 && (
                  <div style={{ padding: 12, textAlign: 'center' }}>
                    <button className="btn btn-ghost btn-sm">View All History</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
