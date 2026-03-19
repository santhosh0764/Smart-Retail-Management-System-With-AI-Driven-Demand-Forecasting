import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#1a9c5e', '#2ecc71', '#16a085', '#27ae60', '#1abc9c'];

export default function Analytics() {
  const [period, setPeriod] = useState('all');
  const [summary, setSummary] = useState({});
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const load = async () => {
    const [s, d, m, c, tp, tc, ls] = await Promise.all([
      axios.get(`/api/analytics/summary?period=${period}`),
      axios.get('/api/analytics/daily'),
      axios.get('/api/analytics/monthly'),
      axios.get('/api/analytics/categories'),
      axios.get('/api/analytics/top-products'),
      axios.get('/api/analytics/top-customers'),
      axios.get('/api/analytics/low-stock'),
    ]);
    setSummary(s.data); setDaily(d.data); setMonthly(m.data.reverse());
    setCategories(c.data); setTopProducts(tp.data); setTopCustomers(tc.data); setLowStock(ls.data);
  };

  useEffect(() => { load(); }, [period]);

  const fmt = n => `₹${(n || 0).toFixed(2)}`;

  return (
    <div>
      <div className="period-tabs">
        {['7days', '30days', 'all'].map(p => (
          <button key={p} className={`period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p === '7days' ? 'Last 7 Days' : p === '30days' ? 'Last 30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-info"><p>Total Revenue</p><h3>{fmt(summary.total_revenue)}</h3></div><div className="stat-icon" style={{ background: '#e8f8f1' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a9c5e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Total Profit</p><h3>{fmt(summary.total_profit)}</h3></div><div className="stat-icon" style={{ background: '#e3f0ff' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Avg. Bill Value</p><h3>{fmt(summary.avg_bill)}</h3></div><div className="stat-icon" style={{ background: '#f3e8ff' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Low Stock Items</p><h3>{summary.low_stock_count || 0}</h3></div><div className="stat-icon" style={{ background: '#ffeaea' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Daily Sales & Profit — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ede8" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `₹${v?.toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#1a9c5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#1565c0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Monthly Revenue & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ede8" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `₹${v?.toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#1a9c5e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="profit" stroke="#1565c0" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Sales by Category</h3>
          {categories.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No sales data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `₹${v?.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ display: 'inline', marginRight: 6 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Top Customers
          </h3>
          {topCustomers.map((c, i) => (
            <div className="list-item" key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#fff3e0' : '#f0f0f0', color: i === 0 ? '#f57c00' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontWeight: 600 }}>{c.customer_name}</span>
              </div>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>₹{c.total_spent.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="charts-grid" style={{ marginTop: 0 }}>
        <div className="card chart-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ display: 'inline', marginRight: 6 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Top Selling Products
          </h3>
          {topProducts.map((p, i) => (
            <div className="list-item" key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: ['#fff3e0', '#f5f5f5', '#e8f0fe'][i] || '#f0f0f0', color: ['#f57c00', '#555', '#1565c0'][i] || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.units_sold} units sold</div>
                </div>
              </div>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>₹{p.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="card chart-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" style={{ display: 'inline', marginRight: 6 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Low Stock Alert
          </h3>
          {lowStock.map((p, i) => (
            <div className="list-item" key={i}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.category}</div>
              </div>
              <span className="badge badge-orange">{p.stock} {p.unit} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
