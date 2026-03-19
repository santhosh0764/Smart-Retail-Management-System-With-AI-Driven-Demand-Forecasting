import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import Profit from './pages/Profit';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import ManageUsers from './pages/ManageUsers';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminRoute><Products /></AdminRoute>} />
            <Route path="billing" element={<Billing />} />
            <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
            <Route path="profit" element={<AdminRoute><Profit /></AdminRoute>} />
            <Route path="reports" element={<Reports />} />
            <Route path="ai-suggestions" element={<AdminRoute><AIInsights /></AdminRoute>} />
            <Route path="users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
