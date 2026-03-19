import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CATEGORIES = ['All', 'Dairy', 'Bakery', 'Snacks', 'Beverages', 'Cleaning', 'Household', 'Personal Care', 'Grains', 'Canned Goods', 'Condiments', 'Cooking'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Dairy', price: '', cost_price: '', stock: '', unit: 'units' });
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    const r = await axios.get('/api/products', { params: { category, search } });
    setProducts(r.data);
  };

  useEffect(() => { fetch(); }, [category, search]);

  const openAdd = () => { setEditing(null); setForm({ name: '', category: 'Dairy', price: '', cost_price: '', stock: '', unit: 'units' }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, cost_price: p.cost_price, stock: p.stock, unit: p.unit }); setShowModal(true); };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) await axios.put(`/api/products/${editing.id}`, form);
      else await axios.post('/api/products', form);
      setShowModal(false); fetch();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await axios.delete(`/api/products/${id}`);
    fetch();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Product Inventory <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({products.length} products)</span>
          </span>
        </h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, padding: '16px 16px 0' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Cost Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><span className="badge" style={{ background: '#f0f0f0', color: '#444' }}>{p.category}</span></td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td>₹{p.cost_price.toFixed(2)}</td>
                  <td>
                    {p.stock <= 10
                      ? <span className="badge badge-orange">⚠ {p.stock} left — Low Stock</span>
                      : <span className="badge badge-green">{p.stock} {p.unit}</span>}
                  </td>
                  <td>
                    <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginRight: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group"><label>Product Name</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Unit</label><input className="form-control" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Sell Price (₹)</label><input className="form-control" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div className="form-group"><label>Cost Price (₹)</label><input className="form-control" type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Stock Quantity</label><input className="form-control" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
