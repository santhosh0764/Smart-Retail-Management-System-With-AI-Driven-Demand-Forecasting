import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    axios.get('/api/analytics/summary').then(r => setSummary(r.data));
    axios.get('/api/analytics/low-stock').then(r => setLowStock(r.data));
    axios.get('/api/sales?period=all').then(r => setSales(r.data.slice(0, 5)));
  }, []);

  const fmt = (n) => `₹${(n || 0).toFixed(2)}`;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info"><p>Total Sales</p><h3>{fmt(summary?.total_revenue)}</h3></div>
          <div className="stat-icon" style={{ background: '#e8f8f1' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a9c5e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><p>Items Sold</p><h3>{summary?.items_sold || 0}</h3></div>
          <div className="stat-icon" style={{ background: '#e3f0ff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><p>Products</p><h3>{summary?.products_count || 0}</h3></div>
          <div className="stat-icon" style={{ background: '#f3e8ff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><p>Low Stock Alerts</p><h3>{summary?.low_stock_count || 0}</h3></div>
          <div className="stat-icon" style={{ background: '#fff3e0' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            Low Stock Alerts
          </h3>
          {lowStock.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No low stock items</p> : lowStock.map(p => (
            <div className="list-item" key={p.id}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.category}</div>
              </div>
              <span className="badge badge-orange">{p.stock} units</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a9c5e" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Recent Sales
          </h3>
          {sales.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No sales recorded yet</p> : sales.map(s => (
            <div className="list-item" key={s.id}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.customer_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(s.sale_date).toLocaleDateString('en-IN')}</div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 14 }}>₹{s.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
