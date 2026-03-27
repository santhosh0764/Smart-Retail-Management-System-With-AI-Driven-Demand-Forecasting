import React, { useState } from 'react';
import axios from 'axios';

const PRIORITY_COLORS = {
  high: { bg: '#ffeaea', color: '#c62828' },
  medium: { bg: '#fff3e0', color: '#e65100' },
  low: { bg: '#e8f8f1', color: '#1b5e20' },
};

const TREND_COLORS = {
  Rising: 'var(--green)',
  Declining: 'var(--red)',
  Stable: 'var(--orange)',
};

const TREND_ICONS = { Rising: '↗', Declining: '↘', Stable: '▪' };

export default function AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [error, setError] = useState('');

  const analyse = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const r = await axios.get('/api/ai/suggestions');
      setData(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to connect to AI. Check your API key and internet connection.');
    }
    setLoading(false);
  };

  const isGroq = data?.powered_by === "smart";

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                Real AI Insights
                <span style={{ background: '#e8f8f1', color: 'var(--green)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {/* <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--green)"><path d="M12 2L13.09 8.26L19 6L15.45 11.27L22 12L15.45 12.73L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.73L2 12L8.55 11.27L5 6L10.91 8.26L12 2Z"/></svg> */}
                  
                </span>
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Click <strong>Analyse My Store</strong> to get real AI suggestions based on your actual products and sales data.
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={analyse} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}></span>
                Analysing...
              </span>
            ) : '✦ Analyse My Store'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--green-mid)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}></div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>AI is analysing your store...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Reading your products, sales history, and inventory data</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ background: '#ffeaea', border: '1px solid #ffcdd2', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 16, color: '#c62828', fontSize: 13 }}>
          <strong>⚠ AI Error:</strong> {error}
        </div>
      )}

      {data && !loading && (
        <>
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-mid)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
          </div>

          {isGroq && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
              {/* <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--green)"><path d="M12 2L13.09 8.26L19 6L15.45 11.27L22 12L15.45 12.73L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.73L2 12L8.55 11.27L5 6L10.91 8.26L12 2Z"/></svg> */}
              
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button className={`period-tab ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>✦ Suggestions</button>
            <button className={`period-tab ${activeTab === 'forecast' ? 'active' : ''}`} onClick={() => setActiveTab('forecast')}>📊 Demand Forecast</button>
          </div>

          {activeTab === 'suggestions' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Actionable Recommendations</h3>
              {(data.suggestions || []).map((s, i) => {
                const c = PRIORITY_COLORS[s.priority] || PRIORITY_COLORS.low;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: 18, background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                      {s.priority === 'high' ? '⚠' : s.priority === 'medium' ? '💡' : '✓'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</h4>
                        <span style={{ background: c.bg, color: c.color, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.priority}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{s.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Product Demand Forecast
              </h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>Trend</th><th>Recommended Action</th><th>Confidence</th></tr></thead>
                  <tbody>
                    {(data.forecast || []).map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{f.product}</td>
                        <td><span style={{ color: TREND_COLORS[f.trend] || '#666', fontWeight: 600 }}>{TREND_ICONS[f.trend] || ''} {f.trend}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{f.action}</td>
                        <td><span style={{ color: f.confidence === 'High' ? 'var(--green)' : f.confidence === 'Medium' ? 'var(--orange)' : 'var(--red)', fontWeight: 600, fontSize: 13 }}>{f.confidence}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: 72, height: 72, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Ready to Analyse</h3>
          <p style={{ fontSize: 13 }}>Click <strong>"Analyse My Store"</strong></p>
        </div>
      )}
    </div>
  );
}