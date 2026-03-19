import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  const load = () => axios.get('/api/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const deleteUser = async (uid) => {
    if (!window.confirm('Delete this user?')) return;
    await axios.delete(`/api/users/${uid}`);
    load();
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Manage Users
          </h3>
          <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
        </div>

        {users.map(u => (
          <div className="user-list-item" key={u.id}>
            <div className={`user-avatar ${u.role === 'admin' ? 'admin' : 'staff'}`}>
              {u.role === 'admin'
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {u.name}
                {u.id === user?.id && <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginLeft: 8 }}>You</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Joined {new Date(u.created_at).toLocaleDateString('en-IN')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {u.role === 'admin'
                ? <span className="badge" style={{ background: '#fff3e0', color: '#f57c00', display: 'flex', alignItems: 'center', gap: 4 }}>👑 Admin</span>
                : <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/></svg>
                    Staff
                  </span>}
              {u.id !== user?.id && (
                <button onClick={() => deleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4, borderRadius: 4 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
