import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases/Cases';
import CaseDetail from './pages/Cases/CaseDetail';
import Documents from './pages/Documents/Documents';
import AIAssistant from './pages/AIAssistant';
import Clients from './pages/ClientPortal/Clients';
import ClientDetail from './pages/ClientPortal/ClientDetail';
import Billing from './pages/Billing/Billing';
import Analytics from './pages/Analytics';
import Templates from './pages/Documents/Templates';
import Profile from './pages/Profile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected - All roles */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="documents" element={<Documents />} />
        <Route path="templates" element={<Templates />} />
        <Route path="ai" element={<ProtectedRoute roles={['admin', 'lawyer']}><AIAssistant /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute roles={['admin', 'lawyer']}><Clients /></ProtectedRoute>} />
        <Route path="clients/:id" element={<ProtectedRoute roles={['admin', 'lawyer']}><ClientDetail /></ProtectedRoute>} />
        <Route path="billing" element={<ProtectedRoute roles={['admin', 'lawyer']}><Billing /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['admin', 'lawyer']}><Analytics /></ProtectedRoute>} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
