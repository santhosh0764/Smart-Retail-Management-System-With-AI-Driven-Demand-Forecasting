import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    axios.get('/api/products').then(r => setProducts(r.data));
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (p) => {
    if (p.stock === 0) return;
    setCart(c => {
      const existing = c.find(i => i.product_id === p.id);
      if (existing) return c.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { product_id: p.id, product_name: p.name, price: p.price, quantity: 1 }];
    });
  };

  const updateQty = (pid, delta) => {
    setCart(c => c.map(i => i.product_id === pid ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const removeItem = (pid) => setCart(c => c.filter(i => i.product_id !== pid));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const completeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await axios.post('/api/sales', {
        customer: customer || 'Walk-in Customer',
        items: cart, subtotal, gst, total
      });
      setReceipt({
        customer: customer || 'Walk-in Customer',
        items: [...cart], subtotal, gst, total,
        date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      });
      setCart([]);
      setCustomer('');
      setShowBill(false);
      axios.get('/api/products').then(r => setProducts(r.data));
    } catch (e) { alert('Sale failed'); }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        .billing-wrap { display: grid; grid-template-columns: 1fr 370px; gap: 16px; height: calc(100vh - 130px); }
        .products-panel { background:#fff; border-radius:var(--radius); border:1px solid var(--border); padding:16px; overflow-y:auto; }
        .products-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
        .bill-panel-desktop { background:#fff; border-radius:var(--radius); border:1px solid var(--border); padding:16px; display:flex; flex-direction:column; overflow-y:auto; }
        .mob-cart-btn { display:none; }
        .mob-overlay { display:none; }
        @media(max-width:900px){
          .billing-wrap { grid-template-columns:1fr; height:auto; }
          .products-grid { grid-template-columns:repeat(2,1fr); }
          .bill-panel-desktop { display:none; }
          .mob-cart-btn {
            display:flex; align-items:center; gap:8px;
            position:fixed; bottom:20px; right:20px; z-index:100;
            background:var(--green); color:#fff; border:none;
            border-radius:50px; padding:13px 22px;
            font-size:14px; font-weight:700; cursor:pointer;
            box-shadow:0 4px 20px rgba(26,156,94,0.45);
            font-family:'DM Sans',sans-serif;
          }
          .mob-overlay {
            display:flex; position:fixed; inset:0;
            background:rgba(0,0,0,0.5); z-index:200;
            align-items:flex-end;
          }
          .mob-sheet {
            background:#fff; border-radius:20px 20px 0 0;
            padding:20px; width:100%; max-height:88vh;
            overflow-y:auto; display:flex; flex-direction:column;
          }
        }
        @media(max-width:480px){
          .products-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      <div className="billing-wrap">
        {/* Products */}
        <div className="products-panel">
          <h3 style={{fontWeight:700,fontSize:15,marginBottom:12}}>Products</h3>
          <div className="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="products-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-tile" onClick={() => addToCart(p)}
                style={{opacity: p.stock===0 ? 0.5:1, cursor: p.stock===0 ? 'not-allowed':'pointer'}}>
                <h4 style={{fontSize:12,marginBottom:4}}>{p.name}</h4>
                <div className="price" style={{fontSize:14}}>₹{p.price.toFixed(2)}</div>
                <div className={`stock-badge ${p.stock<=10?'stock-low':'stock-ok'}`} style={{fontSize:11,marginTop:5}}>
                  {p.stock} in stock
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Bill */}
        <div className="bill-panel-desktop">
          <BillContent customer={customer} setCustomer={setCustomer}
            cart={cart} updateQty={updateQty} removeItem={removeItem}
            subtotal={subtotal} gst={gst} total={total}
            completeSale={completeSale} loading={loading} />
        </div>
      </div>

      {/* Mobile Cart Button */}
      <button className="mob-cart-btn" onClick={() => setShowBill(true)}>
        🛒 Cart
        {cart.length > 0 && (
          <span style={{background:'#fff',color:'var(--green)',borderRadius:20,padding:'2px 9px',fontSize:12,fontWeight:800}}>
            {cart.length}
          </span>
        )}
        {cart.length > 0 && <span style={{fontSize:13}}>• ₹{total.toFixed(0)}</span>}
      </button>

      {/* Mobile Bill Sheet */}
      {showBill && (
        <div className="mob-overlay" onClick={() => setShowBill(false)}>
          <div className="mob-sheet" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:700}}>Current Bill</h3>
              <button onClick={() => setShowBill(false)}
                style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'var(--text-secondary)',lineHeight:1}}>✕</button>
            </div>
            <BillContent customer={customer} setCustomer={setCustomer}
              cart={cart} updateQty={updateQty} removeItem={removeItem}
              subtotal={subtotal} gst={gst} total={total}
              completeSale={completeSale} loading={loading} />
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="modal-overlay" onClick={() => setReceipt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="modal-header">
              <h3>Receipt</h3>
              <button className="modal-close" onClick={() => setReceipt(null)}>✕</button>
            </div>
            <div className="receipt">
              <div className="receipt-header">
                <h2>Smart</h2>
                <p style={{color:'var(--text-secondary)',fontSize:13}}>Management System</p>
                <p style={{color:'var(--text-secondary)',fontSize:12,marginTop:4}}>{receipt.date}</p>
              </div>
              <hr className="receipt-divider" />
              <p style={{fontSize:13,marginBottom:10}}><strong>Customer:</strong> {receipt.customer}</p>
              <hr className="receipt-divider" />
              {receipt.items.map((item,i) => (
                <div key={i} className="receipt-row">
                  <div>
                    <div>{item.product_name}</div>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>{item.quantity} x ₹{item.price.toFixed(2)}</div>
                  </div>
                  <span>₹{(item.price*item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr className="receipt-divider" />
              <div className="receipt-row"><span>Subtotal</span><span>₹{receipt.subtotal.toFixed(2)}</span></div>
              <div className="receipt-row"><span>GST (18%)</span><span>₹{receipt.gst.toFixed(2)}</span></div>
              <hr className="receipt-divider" />
              <div className="receipt-row receipt-total"><span>Total</span><span>₹{receipt.total.toFixed(2)}</span></div>
              <p style={{textAlign:'center',color:'var(--text-secondary)',fontSize:12,marginTop:16}}>Thank you for shopping with us!</p>
            </div>
            <button className="btn btn-outline" style={{width:'100%',marginTop:14}} onClick={() => window.print()}>
              ↓ Print Receipt
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function BillContent({ customer, setCustomer, cart, updateQty, removeItem, subtotal, gst, total, completeSale, loading }) {
  return (
    <>
      <h3 style={{fontSize:15,fontWeight:700,display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Current Bill
      </h3>
      <div className="form-group" style={{marginBottom:12}}>
        <label>Customer Name (Optional)</label>
        <input className="form-control" placeholder="Enter customer name" value={customer} onChange={e => setCustomer(e.target.value)} />
      </div>
      {cart.length === 0 ? (
        <div className="cart-empty" style={{flex:1,minHeight:100}}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Cart is empty<br/><small>Click a product to add</small>
        </div>
      ) : (
        <div className="cart-items" style={{flex:1}}>
          {cart.map(item => (
            <div className="cart-item" key={item.product_id}>
              <div className="cart-item-info">
                <h4>{item.product_name}</h4>
                <p>₹{item.price.toFixed(2)} each</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQty(item.product_id,-1)}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.product_id,1)}>+</button>
                </div>
                <button className="delete-btn" onClick={() => removeItem(item.product_id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="bill-summary">
        <div className="bill-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div className="bill-row"><span>GST (18%)</span><span>₹{gst.toFixed(2)}</span></div>
        <div className="bill-row bill-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        <button className="btn btn-primary complete-btn" onClick={completeSale} disabled={cart.length===0||loading}>
          {loading ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </>
  );
}