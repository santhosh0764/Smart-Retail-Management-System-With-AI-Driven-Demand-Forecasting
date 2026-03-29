import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const close = () => setSidebarOpen(false);

  return (
    <div className="layout">
      {/* Overlay for mobile sidebar */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={close} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>Smart</h1>
          <p>Retail Management</p>
        </div>
        <div className="sidebar-user">
          <div className="role-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            {isAdmin ? 'Admin / Owner' : 'Staff Member'}
          </div>
          <div className="user-name">{user?.name}</div>
          <div className="user-email">{user?.email}</div>
        </div>

        <nav>
          <NavLink to="/dashboard" onClick={close}><Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />Dashboard</NavLink>
          {isAdmin && <NavLink to="/products" onClick={close}><Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />Products</NavLink>}
          <NavLink to="/billing" onClick={close}><Icon d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />Billing / POS</NavLink>
          {isAdmin && <>
            <NavLink to="/analytics" onClick={close}><Icon d="M18 20V10M12 20V4M6 20v-6" />Analytics</NavLink>
            <NavLink to="/profit" onClick={close}><Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />Profit</NavLink>
          </>}
          <NavLink to="/reports" onClick={close}><Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />Reports</NavLink>
          {isAdmin && <>
            <NavLink to="/ai-suggestions" onClick={close}><Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />AI Suggestions</NavLink>
            <NavLink to="/users" onClick={close}><Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />Manage Users</NavLink>
          </>}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-left">
            <h2>Welcome back, {user?.name}!</h2>
            <p>{isAdmin ? 'Admin / Owner' : 'Staff Member'}</p>
          </div>
          <div className="topbar-right">
            <div className="user-info">
              <span>{user?.name}</span>
              <small>{user?.email}</small>
            </div>
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </header>
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}