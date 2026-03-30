from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_db
import bcrypt
import jwt
import datetime
import json
import urllib.request
import urllib.error
from functools import wraps

# ─── SMART AI ENGINE (No API key needed — uses real store data) ──────────────
def generate_smart_insights(db):
    # Fetch all real data
    all_products = db.execute('SELECT * FROM products').fetchall()
    low_stock = db.execute('SELECT * FROM products WHERE stock <= 10 ORDER BY stock').fetchall()
    sales_data = db.execute('''
        SELECT p.name, p.category, p.price, p.cost_price,
               SUM(si.quantity) as units_sold,
               SUM(si.price * si.quantity) as revenue
        FROM sale_items si JOIN products p ON si.product_id=p.id
        GROUP BY p.id ORDER BY units_sold DESC
    ''').fetchall()
    total_rev = float(db.execute('SELECT COALESCE(SUM(total),0) as r FROM sales').fetchone()['r'] or 0)
    total_sales_count = int(db.execute('SELECT COUNT(*) as c FROM sales').fetchone()['c'] or 0)
    total_profit = sum((r['price'] - r['cost_price']) * r['units_sold'] for r in sales_data)
    profit_margin = round((total_profit / total_rev * 100), 1) if total_rev > 0 else 0

    sold_names = {s['name'] for s in sales_data}
    slow_moving = [p for p in all_products if p['name'] not in sold_names]
    top_sellers = list(sales_data[:3])
    high_margin = sorted(all_products, key=lambda p: (p['price']-p['cost_price'])/p['price'], reverse=True)[:3]
    critical_stock = [p for p in low_stock if p['stock'] <= 5]
    warning_stock = [p for p in low_stock if p['stock'] > 5]

    # --- SUMMARY ---
    summary_parts = []
    summary_parts.append(f"Your store has {len(all_products)} products with a total revenue of ₹{round(total_rev, 2)} from {total_sales_count} sales, achieving a profit margin of {profit_margin}%.")
    if low_stock:
        summary_parts.append(f"{len(low_stock)} items are running low on stock — {', '.join([p['name'] for p in low_stock[:3]])} need immediate attention.")
    if top_sellers:
        summary_parts.append(f"Top performing products are {', '.join([s['name'] for s in top_sellers[:2]])} driving most of your revenue.")
    if slow_moving:
        summary_parts.append(f"{len(slow_moving)} products have never been sold and may need promotion or discounting.")
    summary = ' '.join(summary_parts)

    # --- SUGGESTIONS ---
    suggestions = []

    if critical_stock:
        names = ', '.join([p['name'] for p in critical_stock[:4]])
        suggestions.append({
            'title': 'Critical: Restock Immediately',
            'priority': 'high',
            'description': f"{names} {'has' if len(critical_stock)==1 else 'have'} critically low stock (5 units or less). Stockouts will directly impact sales — place restock orders today to avoid losing customers."
        })

    if warning_stock:
        names = ', '.join([p['name'] for p in warning_stock[:3]])
        suggestions.append({
            'title': 'Low Stock Warning',
            'priority': 'high',
            'description': f"{names} are running low. Based on current sales velocity, these items could run out within days. Schedule restocking this week."
        })

    if slow_moving:
        names = ', '.join([p['name'] for p in slow_moving[:3]])
        profit_locked = sum(p['cost_price'] * p['stock'] for p in slow_moving[:3])
        suggestions.append({
            'title': 'Unlock Capital from Slow-Moving Stock',
            'priority': 'medium',
            'description': f"{names} have not sold yet, locking approximately ₹{round(profit_locked)} in idle inventory. Consider a 10-15% discount promotion or bundle deals to convert this stock into revenue."
        })

    if high_margin:
        names = ', '.join([p['name'] for p in high_margin[:2]])
        margins = ', '.join([f"{round((p['price']-p['cost_price'])/p['price']*100,1)}%" for p in high_margin[:2]])
        suggestions.append({
            'title': 'Promote High-Margin Products',
            'priority': 'medium',
            'description': f"{names} have the highest margins ({margins}). Place them at eye level, feature them in offers, or bundle with popular items to maximise profitability."
        })

    if top_sellers:
        top = top_sellers[0]
        suggestions.append({
            'title': f"Capitalise on Best Seller: {top['name']}",
            'priority': 'low',
            'description': f"{top['name']} is your top selling product with {top['units_sold']} units sold and ₹{round(top['revenue'],2)} revenue. Ensure it is always well-stocked and consider placing it near complementary products to increase basket size."
        })

    if profit_margin < 20 and total_rev > 0:
        suggestions.append({
            'title': 'Improve Overall Profit Margin',
            'priority': 'medium',
            'description': f"Your current profit margin is {profit_margin}%, which is below the healthy retail benchmark of 25-30%. Review pricing on low-margin products and negotiate better rates with suppliers."
        })

    # --- DEMAND FORECAST ---
    forecast = []
    for s in sales_data[:3]:
        margin = round((s['price'] - s['cost_price']) / s['price'] * 100, 1)
        forecast.append({
            'product': s['name'],
            'trend': 'Rising',
            'action': f"Strong seller with {s['units_sold']} units sold. Maintain healthy stock levels and consider increasing order quantity by 20% to meet growing demand.",
            'confidence': 'High'
        })

    for p in slow_moving[:2]:
        margin = round((p['price'] - p['cost_price']) / p['price'] * 100, 1)
        forecast.append({
            'product': p['name'],
            'trend': 'Declining',
            'action': f"No sales recorded yet. Try a limited-time 15% discount, reposition on shelf, or bundle with {top_sellers[0]['name'] if top_sellers else 'popular items'} to drive sales.",
            'confidence': 'Medium'
        })

    stable_products = [p for p in all_products
                       if p['name'] not in [s['name'] for s in sales_data[:3]]
                       and p['name'] not in [sp['name'] for sp in slow_moving[:2]]]
    for p in stable_products[:3]:
        stock_status = "adequately stocked" if p['stock'] > 10 else "running low"
        forecast.append({
            'product': p['name'],
            'trend': 'Stable',
            'action': f"Steady demand expected. Currently {stock_status} with {p['stock']} units. {'Reorder soon.' if p['stock'] <= 10 else 'Maintain current order frequency.'}",
            'confidence': 'High'
        })

    return summary, suggestions[:5], forecast[:6]

# ─── REORDER SUGGESTIONS ENGINE ──────────────────────────────────────────────
def generate_reorder_suggestions(db):
    all_products = db.execute('SELECT * FROM products').fetchall()
    sales_data = db.execute('''
        SELECT p.id, p.name, p.category, p.price, p.cost_price, p.stock, p.unit,
               COALESCE(SUM(si.quantity), 0) as total_sold,
               COUNT(DISTINCT s.id) as num_sales
        FROM products p
        LEFT JOIN sale_items si ON si.product_id = p.id
        LEFT JOIN sales s ON s.id = si.sale_id
        GROUP BY p.id
    ''').fetchall()

    reorders = []
    for p in sales_data:
        total_sold = p['total_sold'] or 0
        current_stock = p['stock']
        num_sales = p['num_sales'] or 0

        # Calculate daily sales velocity
        # Assume sales span over last 30 days
        daily_velocity = round(total_sold / 30, 2) if total_sold > 0 else 0

        # Days until stockout
        if daily_velocity > 0:
            days_until_stockout = round(current_stock / daily_velocity)
        else:
            days_until_stockout = 999  # never if no sales

        # Recommended reorder quantity
        # = 30 days of stock + safety buffer of 20%
        if daily_velocity > 0:
            reorder_qty = round((daily_velocity * 30) * 1.2)
        else:
            # For unsold items — suggest minimum reorder
            reorder_qty = 20

        # Reorder cost
        reorder_cost = round(reorder_qty * p['cost_price'], 2)

        # Expected stock after reorder
        expected_stock = current_stock + reorder_qty

        # Urgency level
        if current_stock <= 5:
            urgency = 'critical'
        elif current_stock <= 10:
            urgency = 'high'
        elif days_until_stockout <= 14:
            urgency = 'medium'
        else:
            urgency = 'low'

        # Status message
        if daily_velocity > 0:
            status = f"Selling {daily_velocity}/day — stockout in ~{days_until_stockout} days"
        else:
            status = "No sales yet — minimum stock recommended"

        reorders.append({
            'name': p['name'],
            'category': p['category'],
            'current_stock': current_stock,
            'unit': p['unit'],
            'daily_velocity': daily_velocity,
            'days_until_stockout': days_until_stockout if days_until_stockout != 999 else None,
            'reorder_quantity': reorder_qty,
            'reorder_cost': reorder_cost,
            'expected_stock': expected_stock,
            'urgency': urgency,
            'status': status,
        })

    # Sort by urgency — critical first
    urgency_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    reorders.sort(key=lambda x: urgency_order.get(x['urgency'], 4))
    return reorders
# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
app.config['SECRET_KEY'] = 'stockflow_secret_key_2024'
CORS(app, origins=["*"])
init_db()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user = data
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            if data.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            request.user = data
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

# ─── AUTH ─────────────────────────────────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'staff')
    if not all([name, email, password]):
        return jsonify({'error': 'All fields required'}), 400
    db = get_db()
    if db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone():
        return jsonify({'error': 'Email already exists'}), 409
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    db.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
               (name, email, hashed, role))
    db.commit()
    return jsonify({'message': 'Account created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (data.get('email'),)).fetchone()
    if not user or not bcrypt.checkpw(data.get('password', '').encode(), user['password'].encode()):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = jwt.encode({
        'user_id': user['id'], 'email': user['email'],
        'name': user['name'], 'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({
        'token': token,
        'user': {'id': user['id'], 'name': user['name'], 'email': user['email'], 'role': user['role']}
    })

# ─── PRODUCTS ─────────────────────────────────────────────────────────────────
@app.route('/api/products', methods=['GET'])
@token_required
def get_products():
    db = get_db()
    category = request.args.get('category', '')
    search = request.args.get('search', '')
    query = 'SELECT * FROM products WHERE 1=1'
    params = []
    if category and category != 'All':
        query += ' AND category = ?'; params.append(category)
    if search:
        query += ' AND name LIKE ?'; params.append(f'%{search}%')
    return jsonify([dict(p) for p in db.execute(query, params).fetchall()])

@app.route('/api/products', methods=['POST'])
@admin_required
def add_product():
    data = request.json
    db = get_db()
    db.execute('INSERT INTO products (name, category, price, cost_price, stock, unit) VALUES (?,?,?,?,?,?)',
               (data['name'], data['category'], data['price'], data['cost_price'],
                data['stock'], data.get('unit', 'units')))
    db.commit()
    return jsonify({'message': 'Product added'}), 201

@app.route('/api/products/<int:pid>', methods=['PUT'])
@admin_required
def update_product(pid):
    data = request.json
    db = get_db()
    db.execute('UPDATE products SET name=?,category=?,price=?,cost_price=?,stock=?,unit=? WHERE id=?',
               (data['name'], data['category'], data['price'], data['cost_price'],
                data['stock'], data.get('unit', 'units'), pid))
    db.commit()
    return jsonify({'message': 'Product updated'})

@app.route('/api/products/<int:pid>', methods=['DELETE'])
@admin_required
def delete_product(pid):
    db = get_db()
    db.execute('DELETE FROM products WHERE id = ?', (pid,))
    db.commit()
    return jsonify({'message': 'Product deleted'})

# ─── SALES ────────────────────────────────────────────────────────────────────
@app.route('/api/sales', methods=['POST'])
@token_required
def create_sale():
    from datetime import datetime, timezone, timedelta
    data = request.json
    customer = data.get('customer', 'Walk-in Customer')
    items = data.get('items', [])
    subtotal = data.get('subtotal', 0)
    gst = data.get('gst', 0)
    total = data.get('total', 0)

    # Save sale_date as IST (UTC+5:30) to fix date filter issues
    IST = timezone(timedelta(hours=5, minutes=30))
    ist_now = datetime.now(IST).strftime('%Y-%m-%d %H:%M:%S')

    db = get_db()
    cursor = db.execute(
        'INSERT INTO sales (customer_name, subtotal, gst, total, created_by, sale_date) VALUES (?,?,?,?,?,?)',
        (customer, subtotal, gst, total, request.user['user_id'], ist_now)
    )
    sale_id = cursor.lastrowid
    for item in items:
        db.execute('INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price) VALUES (?,?,?,?,?)',
                   (sale_id, item['product_id'], item['product_name'], item['quantity'], item['price']))
        db.execute('UPDATE products SET stock = stock - ? WHERE id = ?',
                   (item['quantity'], item['product_id']))
    db.commit()
    return jsonify({'message': 'Sale completed', 'sale_id': sale_id})

@app.route('/api/sales', methods=['GET'])
@token_required
def get_sales():
    db = get_db()
    period = request.args.get('period', 'all')
    query = 'SELECT * FROM sales'
    if period == '7days':
        query += " WHERE date(sale_date) >= date('now', '-7 days')"
    elif period == '30days':
        query += " WHERE date(sale_date) >= date('now', '-30 days')"
    elif period == 'today':
        query += " WHERE date(sale_date) = date('now')"
    elif period == 'week':
        query += " WHERE date(sale_date) >= date('now', '-7 days')"
    elif period == 'month':
        query += " WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')"
    query += ' ORDER BY sale_date DESC'
    sales = db.execute(query).fetchall()
    result = []
    for s in sales:
        sale = dict(s)
        sale['items'] = [dict(i) for i in db.execute('SELECT * FROM sale_items WHERE sale_id = ?', (s['id'],)).fetchall()]
        result.append(sale)
    return jsonify(result)

@app.route('/api/sales/<int:sid>', methods=['GET'])
@token_required
def get_sale(sid):
    db = get_db()
    sale = db.execute('SELECT * FROM sales WHERE id = ?', (sid,)).fetchone()
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404
    result = dict(sale)
    result['items'] = [dict(i) for i in db.execute('SELECT * FROM sale_items WHERE sale_id = ?', (sid,)).fetchall()]
    return jsonify(result)

# ─── ANALYTICS ────────────────────────────────────────────────────────────────
@app.route('/api/analytics/summary', methods=['GET'])
@token_required
def analytics_summary():
    try:
        db = get_db()
        period = request.args.get('period', 'all')
        date_filter = ""
        if period == '7days':
            date_filter = "AND date(sale_date) >= date('now', '-7 days')"
        elif period == '30days':
            date_filter = "AND date(sale_date) >= date('now', '-30 days')"
        total_rev = float(db.execute(f"SELECT COALESCE(SUM(total),0) as r FROM sales WHERE 1=1 {date_filter}").fetchone()['r'] or 0)
        avg_bill = float(db.execute(f"SELECT COALESCE(AVG(total),0) as a FROM sales WHERE 1=1 {date_filter}").fetchone()['a'] or 0)
        low_stock = int(db.execute('SELECT COUNT(*) as c FROM products WHERE stock <= 10').fetchone()['c'] or 0)
        products_count = int(db.execute('SELECT COUNT(*) as c FROM products').fetchone()['c'] or 0)
        profit = 0.0
        items_sold = 0
        for r in db.execute(f"SELECT si.price, si.quantity, p.cost_price FROM sale_items si JOIN products p ON si.product_id=p.id JOIN sales s ON si.sale_id=s.id WHERE 1=1 {date_filter}").fetchall():
            profit += (r['price'] - r['cost_price']) * r['quantity']
            items_sold += r['quantity']
        return jsonify({'total_revenue': round(total_rev, 2), 'total_profit': round(profit, 2),
                        'avg_bill': round(avg_bill, 2), 'low_stock_count': low_stock,
                        'products_count': products_count, 'items_sold': items_sold})
    except Exception as e:
        return jsonify({'total_revenue': 0, 'total_profit': 0, 'avg_bill': 0,
                        'low_stock_count': 0, 'products_count': 0, 'items_sold': 0})

@app.route('/api/analytics/daily', methods=['GET'])
@token_required
def analytics_daily():
    try:
        db = get_db()
        rows = db.execute('''SELECT date(s.sale_date) as day, COALESCE(SUM(s.total),0) as revenue,
            COALESCE(SUM((si.price-p.cost_price)*si.quantity),0) as profit
            FROM sales s LEFT JOIN sale_items si ON si.sale_id=s.id LEFT JOIN products p ON p.id=si.product_id
            WHERE date(s.sale_date)>=date('now','-7 days') GROUP BY day ORDER BY day''').fetchall()
        return jsonify([dict(r) for r in rows])
    except:
        return jsonify([])

@app.route('/api/analytics/monthly', methods=['GET'])
@token_required
def analytics_monthly():
    try:
        db = get_db()
        rows = db.execute('''SELECT strftime('%Y-%m',s.sale_date) as month, COALESCE(SUM(s.total),0) as revenue,
            COALESCE(SUM((si.price-p.cost_price)*si.quantity),0) as profit
            FROM sales s LEFT JOIN sale_items si ON si.sale_id=s.id LEFT JOIN products p ON p.id=si.product_id
            GROUP BY month ORDER BY month DESC LIMIT 6''').fetchall()
        return jsonify([dict(r) for r in rows])
    except:
        return jsonify([])

@app.route('/api/analytics/categories', methods=['GET'])
@token_required
def analytics_categories():
    try:
        db = get_db()
        rows = db.execute('SELECT p.category, COALESCE(SUM(si.price*si.quantity),0) as revenue FROM sale_items si JOIN products p ON si.product_id=p.id GROUP BY p.category').fetchall()
        return jsonify([dict(r) for r in rows])
    except:
        return jsonify([])

@app.route('/api/analytics/top-products', methods=['GET'])
@token_required
def top_products():
    try:
        db = get_db()
        rows = db.execute('''SELECT p.name, COALESCE(SUM(si.quantity),0) as units_sold, COALESCE(SUM(si.price*si.quantity),0) as revenue
            FROM sale_items si JOIN products p ON si.product_id=p.id GROUP BY p.id ORDER BY units_sold DESC LIMIT 5''').fetchall()
        return jsonify([dict(r) for r in rows])
    except:
        return jsonify([])

@app.route('/api/analytics/top-customers', methods=['GET'])
@token_required
def top_customers():
    try:
        db = get_db()
        rows = db.execute('SELECT customer_name, COALESCE(SUM(total),0) as total_spent FROM sales GROUP BY customer_name ORDER BY total_spent DESC LIMIT 5').fetchall()
        return jsonify([dict(r) for r in rows])
    except:
        return jsonify([])

@app.route('/api/analytics/low-stock', methods=['GET'])
@token_required
def low_stock_items():
    try:
        db = get_db()
        return jsonify([dict(r) for r in db.execute('SELECT * FROM products WHERE stock <= 10 ORDER BY stock ASC').fetchall()])
    except:
        return jsonify([])

# ─── PROFIT ───────────────────────────────────────────────────────────────────
@app.route('/api/profit', methods=['GET'])
@token_required
def get_profit():
    try:
        db = get_db()
        period = request.args.get('period', 'all')

        # Use EXACT same filter as Reports route which works correctly
        where = ""
        if period == 'today':
            where = "WHERE date(sale_date, 'localtime') = date('now', 'localtime')"
        elif period == 'week':
            where = "WHERE date(sale_date, 'localtime') >= date('now', 'localtime', '-7 days')"
        elif period == 'month':
            where = "WHERE strftime('%Y-%m', sale_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')"

        # For JOIN queries replace WHERE with AND and prefix s.
        join_where = ""
        if period == 'today':
            join_where = "AND date(s.sale_date, 'localtime') = date('now', 'localtime')"
        elif period == 'week':
            join_where = "AND date(s.sale_date, 'localtime') >= date('now', 'localtime', '-7 days')"
        elif period == 'month':
            join_where = "AND strftime('%Y-%m', s.sale_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')"

        # Revenue — EXACT same as reports route
        rev_row = db.execute(
            f"SELECT COALESCE(SUM(total),0) as revenue, COUNT(*) as sales_count FROM sales {where}"
        ).fetchone()
        revenue     = float(rev_row['revenue'] or 0)
        sales_count = int(rev_row['sales_count'] or 0)

        # Profit — JOIN query
        profit = 0.0
        rows = db.execute(
            f"SELECT si.price, si.quantity, p.cost_price "
            f"FROM sale_items si "
            f"JOIN products p ON si.product_id = p.id "
            f"JOIN sales s ON si.sale_id = s.id "
            f"WHERE 1=1 {join_where}"
        ).fetchall()
        for r in rows:
            profit += (r['price'] - r['cost_price']) * r['quantity']

        profit_margin = round((profit / revenue * 100), 1) if revenue > 0 else 0.0

        # Inventory potential (always full stock, no date filter)
        inv = db.execute(
            "SELECT COALESCE(SUM(cost_price*stock),0) as tc, "
            "COALESCE(SUM(price*stock),0) as sv FROM products"
        ).fetchone()
        total_cost    = float(inv['tc'] or 0)
        selling_value = float(inv['sv'] or 0)
        potential     = round(selling_value - total_cost, 2)
        avg_margin    = round((potential / selling_value * 100), 1) if selling_value > 0 else 0.0

        # Per-product breakdown
        breakdown = db.execute(
            "SELECT name, cost_price, price,"
            " (price-cost_price) as profit_per_unit,"
            " ROUND(((price-cost_price)*1.0/price*100),1) as margin,"
            " ((price-cost_price)*stock) as stock_profit"
            " FROM products ORDER BY margin DESC"
        ).fetchall()

        return jsonify({
            'revenue':          round(revenue, 2),
            'profit':           round(profit, 2),
            'profit_margin':    profit_margin,
            'sales_count':      sales_count,
            'total_cost':       round(total_cost, 2),
            'selling_value':    round(selling_value, 2),
            'potential_profit': potential,
            'avg_margin':       avg_margin,
            'breakdown':        [dict(b) for b in breakdown]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── REPORTS ──────────────────────────────────────────────────────────────────
@app.route('/api/reports', methods=['GET'])
@token_required
def get_report():
    try:
        db = get_db()
        report_type = request.args.get('type', 'sales')
        period = request.args.get('period', 'week')
        date_filter = ""
        if period == 'today':
            date_filter = "WHERE date(sale_date, 'localtime') = date('now', 'localtime')"
        elif period == 'week':
            date_filter = "WHERE date(sale_date, 'localtime') >= date('now', 'localtime', '-7 days')"
        elif period == 'month':
            date_filter = "WHERE strftime('%Y-%m', sale_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')"
        elif period == 'year':
            date_filter = "WHERE strftime('%Y', sale_date, 'localtime') = strftime('%Y', 'now', 'localtime')"
        if report_type == 'sales':
            summary_row = db.execute(f"SELECT COALESCE(SUM(total),0) as total_sales, COUNT(*) as transactions, COALESCE(AVG(total),0) as avg_transaction FROM sales {date_filter}").fetchone()
            transactions = db.execute(f'SELECT * FROM sales {date_filter} ORDER BY sale_date DESC').fetchall()
            return jsonify({'summary': dict(summary_row), 'transactions': [dict(t) for t in transactions]})
        elif report_type == 'inventory':
            return jsonify({'products': [dict(p) for p in db.execute('SELECT * FROM products ORDER BY stock ASC').fetchall()]})
        elif report_type == 'profit':
            revenue = 0.0; profit = 0.0
            for r in db.execute(f"SELECT total FROM sales {date_filter}").fetchall():
                revenue += r['total']
            for r in db.execute(f"SELECT si.price, si.quantity, p.cost_price FROM sale_items si JOIN products p ON si.product_id=p.id JOIN sales s ON si.sale_id=s.id {date_filter}").fetchall():
                profit += (r['price'] - r['cost_price']) * r['quantity']
            return jsonify({'revenue': round(revenue, 2), 'profit': round(profit, 2)})
        return jsonify({'error': 'Unknown report type'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── USERS ────────────────────────────────────────────────────────────────────
@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    db = get_db()
    return jsonify([dict(u) for u in db.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at').fetchall()])

@app.route('/api/users/<int:uid>', methods=['DELETE'])
@admin_required
def delete_user(uid):
    if uid == request.user['user_id']:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (uid,))
    db.commit()
    return jsonify({'message': 'User deleted'})

# ─── AI SUGGESTIONS — Smart Engine (Real Data, No API needed) ─────────────────
@app.route('/api/ai/suggestions', methods=['GET'])
@token_required
def ai_suggestions():
    try:
        db = get_db()
        summary, suggestions, forecast = generate_smart_insights(db)
        reorders = generate_reorder_suggestions(db)
        return jsonify({
            'summary': summary,
            'suggestions': suggestions,
            'forecast': forecast,
            'reorders': reorders,
            'powered_by': 'smart'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── DYNAMIC PRICE OPTIMIZATION ENGINE ───────────────────────────────────────
def optimize_price(product, units_sold, avg_sold):
    current_price = float(product['price'])
    cost_price    = float(product['cost_price'])
    stock         = int(product['stock'])
    name          = product['name']

    if units_sold == 0:
        demand = 'none'
    elif units_sold >= avg_sold * 1.5:
        demand = 'high'
    elif units_sold >= avg_sold * 0.5:
        demand = 'moderate'
    else:
        demand = 'low'

    if stock <= 5:
        stock_level = 'critical'
    elif stock <= 10:
        stock_level = 'low'
    elif stock <= 25:
        stock_level = 'moderate'
    else:
        stock_level = 'high'

    adjustment = 0.0
    reasons = []

    if demand == 'high':
        adjustment += 10.0
        reasons.append('High demand — product is selling fast')
    elif demand == 'moderate':
        adjustment += 2.0
        reasons.append('Moderate demand — stable sales')
    elif demand == 'low':
        adjustment -= 8.0
        reasons.append('Low demand — price reduction recommended to attract buyers')
    elif demand == 'none':
        adjustment -= 12.0
        reasons.append('No sales recorded — significant discount recommended')

    if stock_level == 'critical':
        adjustment += 8.0
        reasons.append('Critical low stock — scarcity justifies higher price')
    elif stock_level == 'low':
        adjustment += 4.0
        reasons.append('Low stock — slight price increase recommended')
    elif stock_level == 'high':
        adjustment -= 6.0
        reasons.append('Excess stock — reduce price to clear inventory faster')

    optimized_price = round(current_price * (1 + adjustment / 100), 2)
    min_price = round(cost_price * 1.05, 2)
    if optimized_price < min_price:
        optimized_price = min_price
        reasons.append('Price floored at minimum margin (cost + 5%)')
    max_price = round(current_price * 1.25, 2)
    if optimized_price > max_price:
        optimized_price = max_price
        reasons.append('Price capped at 25% above current')

    price_change     = round(optimized_price - current_price, 2)
    price_change_pct = round((price_change / current_price) * 100, 1)

    if price_change > 0:
        tag = 'Increase Price'
    elif price_change < 0:
        tag = 'Decrease Price'
    else:
        tag = 'Keep Current Price'

    return {
        'product_name':     name,
        'current_price':    current_price,
        'optimized_price':  optimized_price,
        'price_change':     price_change,
        'price_change_pct': price_change_pct,
        'recommendation':   tag,
        'demand_level':     demand,
        'stock_level':      stock_level,
        'units_sold':       units_sold,
        'current_stock':    stock,
        'cost_price':       cost_price,
        'reason':           ' | '.join(reasons) if reasons else 'Price is optimal',
    }

@app.route('/api/ai/price-optimize', methods=['GET'])
@token_required
def price_optimize():
    try:
        db = get_db()
        product_name = request.args.get('product', '').strip()

        # Get all sales data upfront
        all_sales = db.execute(
            'SELECT product_id, SUM(quantity) as total FROM sale_items GROUP BY product_id'
        ).fetchall()
        sales_map  = {row['product_id']: int(row['total']) for row in all_sales}
        total_sold = sum(sales_map.values())

        if product_name:
            product = db.execute(
                'SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)',
                (f'%{product_name}%',)
            ).fetchone()
            if not product:
                return jsonify({'error': f'Product "{product_name}" not found. Please check the name and try again.'}), 404
            all_count  = db.execute('SELECT COUNT(*) as c FROM products').fetchone()['c']
            units_sold = sales_map.get(product['id'], 0)
            avg_sold   = total_sold / max(all_count, 1)
            result     = optimize_price(dict(product), units_sold, avg_sold)
            return jsonify({'type': 'single', 'result': result})
        else:
            all_products = db.execute('SELECT * FROM products ORDER BY name').fetchall()
            if not all_products:
                return jsonify({'error': 'No products found in database'}), 404
            avg_sold = total_sold / max(len(all_products), 1)
            results  = []
            for p in all_products:
                units = sales_map.get(p['id'], 0)
                results.append(optimize_price(dict(p), units, avg_sold))
            results.sort(key=lambda x: abs(x['price_change_pct']), reverse=True)
            return jsonify({'type': 'all', 'count': len(results), 'results': results})

    except Exception as e:
        import traceback
        print('PRICE OPTIMIZE ERROR:', traceback.format_exc())
        return jsonify({'error': f'Server error: {str(e)}'}), 500
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)