import React, { useState } from 'react';
import axios from 'axios';

const PRIORITY_COLORS = {
  high:   { bg: '#ffeaea', color: '#c62828' },
  medium: { bg: '#fff3e0', color: '#e65100' },
  low:    { bg: '#e8f8f1', color: '#1b5e20' },
};
const TREND_COLORS = { Rising: 'var(--green)', Declining: 'var(--red)', Stable: 'var(--orange)' };
const TREND_ICONS  = { Rising: '↗', Declining: '↘', Stable: '▪' };

// ── Price optimization logic (pure JS — no backend needed) ──
function calculateOptimizedPrice(product, unitsSold, avgSold) {
  const currentPrice = parseFloat(product.price);
  const costPrice    = parseFloat(product.cost_price);
  const stock        = parseInt(product.stock);

  let demand = 'none';
  if      (unitsSold === 0)              demand = 'none';
  else if (unitsSold >= avgSold * 1.5)   demand = 'high';
  else if (unitsSold >= avgSold * 0.5)   demand = 'moderate';
  else                                   demand = 'low';

  let stockLevel = 'high';
  if      (stock <= 5)  stockLevel = 'critical';
  else if (stock <= 10) stockLevel = 'low';
  else if (stock <= 25) stockLevel = 'moderate';

  let adjustment = 0;
const reasons = [];

// 1. High Demand + Low/Critical Stock → Increase Price
if (demand === 'high' && (stockLevel === 'low' || stockLevel === 'critical')) {
  adjustment = 10;
  reasons.push("Strong customer demand combined with limited inventory indicates an opportunity to increase price while maximizing revenue and preventing stockouts.");
}

// 2. No Sales + High Stock → Decrease Price (Heavy)
else if (demand === 'none' && stockLevel === 'high') {
  adjustment = -12;
  reasons.push("Lack of sales despite high inventory levels suggests low demand, requiring a significant price reduction to stimulate purchases and clear stock.");
}

// 3. Low Demand + High Stock → Decrease Price
else if (demand === 'low' && stockLevel === 'high') {
  adjustment = -8;
  reasons.push("Slow-moving inventory and excess stock levels indicate the need for a price reduction to improve sales velocity and reduce holding costs.");
}

// 4. Critical Stock (≤5) → Increase Price (Scarcity)
else if (stockLevel === 'critical') {
  adjustment = 8;
  reasons.push("Critically low inventory creates scarcity, justifying a price increase to optimize profit margins and control rapid stock depletion.");
}

// 5. Moderate Demand + Moderate Stock → Keep Price
else if (demand === 'moderate' && stockLevel === 'moderate') {
  adjustment = 0;
  reasons.push("Balanced demand and stock levels indicate that the current price is optimal and does not require adjustment.");
}

// 6. High Demand + High Stock → Slight Increase
else if (demand === 'high' && stockLevel === 'high') {
  adjustment = 5;
  reasons.push("Strong demand with sufficient inventory supports a moderate price increase to enhance revenue while maintaining sales momentum.");
}

// 7. Low Demand + Low Stock → Keep Price
else if (demand === 'low' && stockLevel === 'low') {
  adjustment = 0;
  reasons.push("Low demand with limited stock suggests maintaining current pricing to avoid unnecessary price fluctuations.");
}

// 8. No Sales + Low Stock → Keep Price
else if (demand === 'none' && stockLevel === 'low') {
  adjustment = 0;
  reasons.push("No recent sales but limited stock availability suggests holding price to avoid undervaluing the product.");
}

// 9. Moderate Demand + High Stock → Slight Decrease
else if (demand === 'moderate' && stockLevel === 'high') {
  adjustment = -4;
  reasons.push("Moderate demand combined with excess inventory suggests a slight price reduction to improve turnover.");
}

// 🔹 Default fallback (safety)
else {
  adjustment = 0;
  reasons.push("Current demand and stock conditions do not require a price adjustment.");
}

  let optimizedPrice = Math.round(currentPrice * (1 + adjustment / 100) * 100) / 100;
  const minPrice = Math.round(costPrice * 1.05 * 100) / 100;
  const maxPrice = Math.round(currentPrice * 1.25 * 100) / 100;

  if (optimizedPrice < minPrice) { optimizedPrice = minPrice; reasons.push('Price floored at minimum margin (cost + 5%)'); }
  if (optimizedPrice > maxPrice) { optimizedPrice = maxPrice; reasons.push('Price capped at 25% above current'); }

  const priceChange    = Math.round((optimizedPrice - currentPrice) * 100) / 100;
  const priceChangePct = Math.round((priceChange / currentPrice) * 1000) / 10;
  const recommendation = priceChange > 0 ? 'Increase Price' : priceChange < 0 ? 'Decrease Price' : 'Keep Current Price';

  return {
    product_name:     product.name,
    category:         product.category,
    current_price:    currentPrice,
    optimized_price:  optimizedPrice,
    price_change:     priceChange,
    price_change_pct: priceChangePct,
    recommendation,
    demand_level:     demand,
    stock_level:      stockLevel,
    units_sold:       unitsSold,
    current_stock:    stock,
    cost_price:       costPrice,
    reason:           reasons.join(' | ') || 'Price is optimal',
  };
}

function PriceCard({ r }) {
  const up   = r.price_change > 0;
  const down = r.price_change < 0;
  const bg    = up ? '#ffeaea' : down ? '#fff3e0' : '#e8f8f1';
  const color = up ? '#c62828' : down ? '#e65100' : '#1b5e20';
  const icon  = up ? '↑' : down ? '↓' : '=';

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700 }}>{r.product_name}</h4>
            <span style={{ fontSize: 11, background: 'var(--bg-main)', padding: '2px 8px', borderRadius: 20, color: 'var(--text-secondary)' }}>{r.category}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Current: <strong style={{ color: 'var(--text-primary)' }}>₹{r.current_price.toFixed(2)}</strong>
            </span>
            <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)' }}>₹{r.optimized_price.toFixed(2)}</span>
            <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {icon} {r.price_change >= 0 ? '+' : ''}₹{r.price_change.toFixed(2)} ({r.price_change_pct >= 0 ? '+' : ''}{r.price_change_pct}%)
            </span>
            {/* <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {r.recommendation}
            </span> */}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', lineHeight: 1.8 }}>
          <div>Cost: ₹{r.cost_price.toFixed(2)}</div>
          <div>Sold: {r.units_sold} units</div>
          <div>Stock: {r.current_stock}</div>
        </div>
      </div>
      <div style={{ background: 'var(--bg-main)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Reason: </strong>{r.reason}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, background: 'var(--bg-main)', padding: '3px 10px', borderRadius: 20 }}>Demand: <strong>{r.demand_level}</strong></span>
        <span style={{ fontSize: 11, background: 'var(--bg-main)', padding: '3px 10px', borderRadius: 20 }}>Stock level: <strong>{r.stock_level}</strong></span>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const [mainTab, setMainTab] = useState('ai');

  // AI state
  const [aiData,    setAiData]    = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState('');
  const [subTab,    setSubTab]    = useState('suggestions');

  // Price state
  const [searchName,   setSearchName]   = useState('');
  const [priceResults, setPriceResults] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError,   setPriceError]   = useState('');

  const analyse = async () => {
    setAiLoading(true); setAiError(''); setAiData(null);
    try {
      const r = await axios.get('/api/ai/suggestions');
      setAiData(r.data);
    } catch (e) {
      setAiError('Failed to load AI insights. Make sure Flask is running on port 5000.');
    }
    setAiLoading(false);
  };

  // Price optimization — runs entirely in JS using products + sales APIs
  const optimizePrice = async () => {
    setPriceLoading(true); setPriceError(''); setPriceResults(null);
    try {
      // Fetch products and sales data from existing working APIs
      const [productsRes, salesRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/sales'),
      ]);

      const products = productsRes.data;
      const sales    = salesRes.data;

      if (!products || products.length === 0) {
        setPriceError('No products found in database.');
        setPriceLoading(false);
        return;
      }

      // Build sales map: product_id → total units sold
      const salesMap = {};
      sales.forEach(sale => {
        (sale.items || []).forEach(item => {
          salesMap[item.product_id] = (salesMap[item.product_id] || 0) + item.quantity;
        });
      });

      const totalSold = Object.values(salesMap).reduce((a, b) => a + b, 0);
      const avgSold   = totalSold / Math.max(products.length, 1);

      let filtered = products;
      if (searchName.trim()) {
        filtered = products.filter(p =>
          p.name.toLowerCase().includes(searchName.trim().toLowerCase())
        );
        if (filtered.length === 0) {
          setPriceError(`No product found matching "${searchName}". Check the spelling and try again.`);
          setPriceLoading(false);
          return;
        }
      }

      const results = filtered.map(p => {
        const unitsSold = salesMap[p.id] || 0;
        return calculateOptimizedPrice(p, unitsSold, avgSold);
      });

      // Sort by biggest price change first
      results.sort((a, b) => Math.abs(b.price_change_pct) - Math.abs(a.price_change_pct));
      setPriceResults({ results, isSingle: searchName.trim().length > 0 });

    } catch (e) {
      setPriceError('Could not fetch data. Make sure Flask is running on port 5000.');
    }
    setPriceLoading(false);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setMainTab(id)} style={{
      padding: '11px 20px', border: 'none', background: 'none',
      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
      fontSize: 14, fontWeight: 600,
      color: mainTab === id ? 'var(--green)' : 'var(--text-secondary)',
      borderBottom: mainTab === id ? '2.5px solid var(--green)' : '2.5px solid transparent',
      marginBottom: -1, transition: 'all 0.15s',
    }}>{label}</button>
  );

  const Spinner = () => (
    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  );

  return (
    <div>
      {/* Main tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <TabBtn id="ai"    label="AI Suggestions" />
        <TabBtn id="price" label="Price Optimization" />
      </div>

      {/* ══ TAB 1 — AI SUGGESTIONS ══ */}
      {mainTab === 'ai' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                    Real AI Insights
                    <span style={{ background: '#e8f8f1', color: 'var(--green)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}></span>
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Click <strong>Analyse My Store</strong> to get insights from your live store data.</p>
                </div>
              </div>
              <button className="btn btn-primary" onClick={analyse} disabled={aiLoading}>
                {aiLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Analysing...</span> : '✦ Analyse My Store'}
              </button>
            </div>
          </div>

          {aiLoading && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: '3px solid var(--green-mid)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Analysing your store...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Reading products, sales history, margins and stock levels</p>
            </div>
          )}

          {aiError && !aiLoading && (
            <div style={{ background: '#ffeaea', border: '1px solid #ffcdd2', borderRadius: 12, padding: '14px 18px', marginBottom: 16, color: '#c62828', fontSize: 13 }}>
              <strong>⚠ Error:</strong> {aiError}
            </div>
          )}

          {aiData && !aiLoading && (
            <>
              <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-mid)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>{aiData.summary}</p>
              </div>

              <div className="period-tabs">
                <button className={`period-tab ${subTab === 'suggestions' ? 'active' : ''}`} onClick={() => setSubTab('suggestions')}> Suggestions</button>
                <button className={`period-tab ${subTab === 'forecast' ? 'active' : ''}`} onClick={() => setSubTab('forecast')}>Demand Forecast</button>
              </div>

              {subTab === 'suggestions' && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Actionable Recommendations</h3>
                  {(aiData.suggestions || []).map((s, i) => {
                    const c = PRIORITY_COLORS[s.priority] || PRIORITY_COLORS.low;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 14, padding: 18, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                          {s.priority === 'high' ? '⚠' : s.priority === 'medium' ? '💡' : '✓'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
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

              {subTab === 'forecast' && (
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Product Demand Forecast</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Product</th><th>Trend</th><th>Recommended Action</th><th>Confidence</th></tr></thead>
                      <tbody>
                        {(aiData.forecast || []).map((f, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{f.product}</td>
                            <td><span style={{ color: TREND_COLORS[f.trend] || '#666', fontWeight: 600 }}>{TREND_ICONS[f.trend]} {f.trend}</span></td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{f.action}</td>
                            <td><span style={{ color: f.confidence === 'High' ? 'var(--green)' : f.confidence === 'Medium' ? 'var(--orange)' : 'var(--red)', fontWeight: 600 }}>{f.confidence}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {!aiData && !aiLoading && !aiError && (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
              <div style={{ width: 72, height: 72, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Ready to Analyse</h3>
              <p style={{ fontSize: 13 }}>Click <strong>"Analyse My Store"</strong> to get AI insights from your live data</p>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2 — PRICE OPTIMIZATION ══ */}
      {mainTab === 'price' && (
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Dynamic Price Optimization</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
              Enter a product name to get the optimized price based on demand, stock level, and sales velocity.
              Leave blank to optimize <strong>all products</strong> at once.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <input
                className="form-control"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="Enter product name e.g. Fresh Milk (or leave blank for all)"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && optimizePrice()}
              />
              <button className="btn btn-primary" onClick={optimizePrice} disabled={priceLoading} style={{ flexShrink: 0, minWidth: 160 }}>
                {priceLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Optimizing...</span> : '💰 Optimize Price'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[
                // { icon: '📈', title: 'High demand + Low stock', result: '→ Increase price' },
                // { icon: '📉', title: 'Low demand + High stock', result: '→ Decrease price' },
                // { icon: '✅', title: 'Balanced demand & stock', result: '→ Keep current price' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-main)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.result}</div>
                </div>
              ))}
            </div>
          </div>

          {priceLoading && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, border: '3px solid var(--green-mid)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Calculating optimal prices...</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Analysing demand, stock levels and sales data</p>
            </div>
          )}

          {priceError && !priceLoading && (
            <div style={{ background: '#ffeaea', border: '1px solid #ffcdd2', borderRadius: 12, padding: '14px 18px', marginBottom: 16, color: '#c62828', fontSize: 13 }}>
              <strong>⚠ Error:</strong> {priceError}
            </div>
          )}

          {priceResults && !priceLoading && (
            <>
              {/* Summary stats */}
              {!priceResults.isSingle && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 18 }}>
                  {[
                    { label: 'Total Products',  val: priceResults.results.length, bg: 'var(--blue-light)', color: 'var(--blue)' },
                    { label: 'Increase Price',  val: priceResults.results.filter(r => r.price_change > 0).length,  bg: '#ffeaea', color: '#c62828' },
                    { label: 'Decrease Price',  val: priceResults.results.filter(r => r.price_change < 0).length,  bg: '#fff3e0', color: '#e65100' },
                    { label: 'Keep Price',      val: priceResults.results.filter(r => r.price_change === 0).length, bg: 'var(--green-light)', color: 'var(--green)' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ fontSize: 11, color: s.color, fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                      <h3 style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</h3>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                {priceResults.isSingle
                  ? 'Price Optimization Result'
                  : `All Products — Price Optimization (${priceResults.results.length} products)`}
              </h3>

              {priceResults.results.map((r, i) => <PriceCard key={i} r={r} />)}
            </>
          )}

          {!priceResults && !priceLoading && !priceError && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}></div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Price Optimizer Ready</h3>
              <p style={{ fontSize: 13, lineHeight: 1.8 }}>
                Type a product name and click <strong>"Optimize Price"</strong><br />
                Or leave blank to optimize <strong>all products</strong> at once
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}