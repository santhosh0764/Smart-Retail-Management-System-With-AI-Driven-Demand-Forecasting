import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profit() {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`/api/profit?period=${period}`).then(r => setData(r.data));
  }, [period]);

  const fmt = n => `₹${(n || 0).toFixed(2)}`;
  const marginColor = m => m >= 30 ? 'var(--green)' : m >= 20 ? 'var(--orange)' : 'var(--red)';
  const marginBg = m => m >= 30 ? 'var(--green-light)' : m >= 20 ? 'var(--orange-light)' : 'var(--red-light)';

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div>
      <div className="period-tabs">
        {periods.map(p => (
          <button key={p.key} className={`period-tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
        ))}
      </div>

      <div className="profit-section-label">SALES PROFIT — {periods.find(p => p.key === period)?.label?.toUpperCase()}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-info"><p>Revenue</p><h3>{fmt(data?.revenue)}</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>{data?.sales_count || 0} sales</small></div><div className="stat-icon" style={{ background: '#e3f0ff' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Profit Earned</p><h3>{fmt(data?.profit)}</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>After cost deduction</small></div><div className="stat-icon" style={{ background: '#e8f8f1' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a9c5e" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Profit Margin</p><h3 style={{ color: marginColor(data?.profit_margin) }}>{data?.profit_margin || 0}%</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>On sales made</small></div><div className="stat-icon" style={{ background: '#f3e8ff' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div></div>
      </div>

      <div className="profit-section-label">INVENTORY PROFIT POTENTIAL — ALL STOCK</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-info"><p>Total Cost</p><h3 style={{ fontSize: 20 }}>{fmt(data?.total_cost)}</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>What you paid</small></div><div className="stat-icon" style={{ background: '#ffeaea' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Selling Value</p><h3 style={{ fontSize: 20 }}>{fmt(data?.selling_value)}</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>If all sold</small></div><div className="stat-icon" style={{ background: '#e3f0ff' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Potential Profit</p><h3 style={{ fontSize: 20 }}>{fmt(data?.potential_profit)}</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>If all sold</small></div><div className="stat-icon" style={{ background: '#e8f8f1' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a9c5e" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div>
        <div className="stat-card"><div className="stat-info"><p>Avg Margin</p><h3 style={{ fontSize: 20 }}>{data?.avg_margin || 0}%</h3><small style={{ color: 'var(--text-muted)', fontSize: 11 }}>Across all products</small></div><div className="stat-icon" style={{ background: '#f3e8ff' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Highest Margin Products
          </h3>
          {(data?.breakdown || []).slice(0, 5).map((p, i) => (
            <div className="list-item" key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cost ₹{p.cost_price} → Sell ₹{p.price}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: marginBg(p.margin), color: marginColor(p.margin), padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{p.margin}%</span>
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>+₹{p.profit_per_unit}/unit</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Lowest Margin Products
          </h3>
          {(data?.breakdown || []).slice(-5).reverse().map((p, i) => (
            <div className="list-item" key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cost ₹{p.cost_price} → Sell ₹{p.price}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: marginBg(p.margin), color: marginColor(p.margin), padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{p.margin}%</span>
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>+₹{p.profit_per_unit}/unit</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          All Products — Profit Breakdown
        </h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Cost Price</th><th>Sell Price</th><th>Profit/Unit</th><th>Margin</th><th>Stock Profit</th></tr></thead>
            <tbody>
              {(data?.breakdown || []).map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>₹{p.cost_price.toFixed(2)}</td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>+₹{p.profit_per_unit.toFixed(2)}</td>
                  <td><span style={{ background: marginBg(p.margin), color: marginColor(p.margin), padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{p.margin}%</span></td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{p.stock_profit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
