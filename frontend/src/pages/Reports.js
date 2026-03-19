import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);

  const generate = async () => {
    const r = await axios.get(`/api/reports?type=${reportType}&period=${period}`);
    setData(r.data);
  };

  useEffect(() => { generate(); }, []);

  const handlePrint = () => window.print();

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ display: 'inline', marginRight: 6 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Generate Reports
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Report Type</label>
            <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="profit">Profit Report</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Date Range</label>
            <select className="form-control" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={generate}>
          ↓ Generate & Print Report
        </button>
      </div>

      {data && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>StockFlow</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Retail Management System</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Generated on {today}</p>
          </div>

          {reportType === 'sales' && data.summary && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--green)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Sales Report
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                <div style={{ background: 'var(--bg-main)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total Sales</p>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>₹{data.summary.total_sales?.toFixed(2)}</h3>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Transactions</p>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{data.summary.transactions}</h3>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg. Transaction</p>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>₹{data.summary.avg_transaction?.toFixed(2)}</h3>
                </div>
              </div>
              <table>
                <thead><tr><th>Date</th><th>Customer</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {data.transactions?.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.sale_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>{t.customer_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{t.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {reportType === 'inventory' && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--green)' }}>Inventory Report</h3>
              <table>
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th></tr></thead>
                <tbody>
                  {data.products?.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td>₹{p.price.toFixed(2)}</td>
                      <td>₹{p.cost_price.toFixed(2)}</td>
                      <td>{p.stock <= 10 ? <span className="badge badge-orange">⚠ {p.stock}</span> : <span className="badge badge-green">{p.stock}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {reportType === 'profit' && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--green)' }}>Profit Report</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--bg-main)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Revenue</p>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>₹{data.revenue?.toFixed(2)}</h3>
                </div>
                <div style={{ background: 'var(--green-light)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 11, color: 'var(--green)' }}>Net Profit</p>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>₹{data.profit?.toFixed(2)}</h3>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button className="btn btn-outline" onClick={handlePrint}>↓ Print Report</button>
          </div>
        </div>
      )}
    </div>
  );
}
