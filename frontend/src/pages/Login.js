import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'admin' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); 
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      setTab('login');
      setError('');
      alert('Account created! Please sign in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <div className="logo-icon">SF</div>
          <h1>Smart</h1>
          <p>Retail Management System</p>
        </div>

        <div className="login-tabs">
          <div className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</div>
          <div className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Create Account</div>
        </div>

        {error && <div style={{ background: '#ffeaea', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '12px', fontSize: 14 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
              Don't have an account? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('register')}>Create one</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className="form-control" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Account Role</label>
              <div className="role-cards">
                <div className={`role-card ${form.role === 'admin' ? 'selected' : ''}`} onClick={() => set('role', 'admin')}>
                  <h4>Admin / Owner</h4>
                  <p>Full access to everything</p>
                </div>
                <div className={`role-card ${form.role === 'staff' ? 'selected' : ''}`} onClick={() => set('role', 'staff')}>
                  <h4>Staff Member</h4>
                  <p>Billing / POS only</p>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '12px', fontSize: 14 }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
              Already have an account? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('login')}>Sign in</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
