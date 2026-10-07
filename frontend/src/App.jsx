import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

// Components
import Navbar from './components/Navbar';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MedicinesPage from './pages/MedicinesPage';
import MedicineDetailPage from './pages/MedicineDetailPage';

// Protected User Pages
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrescriptionPage from './pages/PrescriptionPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-wrapper flex items-center justify-center"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="page-wrapper flex items-center justify-center"><div className="spinner" /></div>;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontSize: 14, fontWeight: 500, borderRadius: 10 } }} />
      <Routes>
        {/* Public Routes with Navbar */}
        <Route element={<><Navbar /><Outlet /></>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/medicines" element={<MedicinesPage />} />
          <Route path="/categories" element={<MedicinesPage />} />
          <Route path="/medicines/:id" element={<MedicineDetailPage />} />
          
          {/* Protected Routes */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/upload-prescription" element={<ProtectedRoute><PrescriptionPage /></ProtectedRoute>} />
        </Route>

        {/* Auth Routes (No Navbar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin Routes (Custom Layout) */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          {/* Add more admin routes here as needed for future expansion */}
        </Route>
      </Routes>
    </>
  );
}



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
