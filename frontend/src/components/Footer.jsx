import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-disclaimer">
          ⚕️ <strong>Medical Disclaimer:</strong> Information provided on this platform is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting, changing, or stopping any medication. Prescription medicines require a valid prescription from a licensed physician.
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">💊 <span>E-Pharmacy</span></div>
            <p className="footer-desc">
              Your trusted online pharmacy. We bring authentic medicines to your doorstep, ensuring safety, quality, and convenience.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              <Phone size={14} /> 1800-XXX-XXXX (Toll Free)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <Mail size={14} /> support@epharmacy.com
            </div>
          </div>

          <div>
            <div className="footer-col-title">Quick Links</div>
            {['/', '/medicines', '/categories', '/upload-prescription', '/cart'].map((to, i) => (
              <Link key={to} to={to} className="footer-link">
                {['Home', 'Medicines', 'Categories', 'Upload Prescription', 'Cart'][i]}
              </Link>
            ))}
          </div>

          <div>
            <div className="footer-col-title">Account</div>
            {['/login', '/signup', '/orders', '/profile', '/prescriptions'].map((to, i) => (
              <Link key={to} to={to} className="footer-link">
                {['Login', 'Sign Up', 'My Orders', 'My Profile', 'My Prescriptions'][i]}
              </Link>
            ))}
          </div>

          <div>
            <div className="footer-col-title">Legal</div>
            <span className="footer-link">Privacy Policy</span>
            <span className="footer-link">Terms of Service</span>
            <span className="footer-link">Refund Policy</span>
            <span className="footer-link">Shipping Policy</span>
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Secured by</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
                <Shield size={14} style={{ color: 'var(--accent-400)' }} /> SSL Secured
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2024 E-Pharmacy. All rights reserved. | Demo Prototype</span>
          <span>🇮🇳 Made in India</span>
        </div>
      </div>
    </footer>
  );
}
