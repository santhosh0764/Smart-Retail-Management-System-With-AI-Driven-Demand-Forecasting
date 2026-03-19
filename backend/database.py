import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'stockflow.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'staff',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            cost_price REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            unit TEXT DEFAULT 'units',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT DEFAULT 'Walk-in Customer',
            subtotal REAL NOT NULL,
            gst REAL NOT NULL,
            total REAL NOT NULL,
            created_by INTEGER,
            sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    ''')

    # Seed products if empty
    count = db.execute('SELECT COUNT(*) as c FROM products').fetchone()['c']
    if count == 0:
        products = [
            ('Fresh Milk', 'Dairy', 62.00, 45.00, 45, 'packets'),
            ('Whole Wheat Bread', 'Bakery', 45.00, 30.00, 8, 'packets'),
            ('Eggs', 'Dairy', 90.00, 70.00, 30, 'trays'),
            ('Cheddar Cheese', 'Dairy', 280.00, 210.00, 15, 'packets'),
            ('Potato Chips', 'Snacks', 30.00, 20.00, 25, 'packets'),
            ('Cola Soda 2L', 'Beverages', 90.00, 65.00, 5, 'bottles'),
            ('Orange Juice 1L', 'Beverages', 120.00, 85.00, 20, 'bottles'),
            ('Dish Soap', 'Cleaning', 55.00, 35.00, 35, 'bottles'),
            ('Laundry Detergent', 'Cleaning', 220.00, 160.00, 12, 'packets'),
            ('Green Tea', 'Beverages', 150.00, 100.00, 18, 'boxes'),
            ('Olive Oil', 'Cooking', 320.00, 240.00, 10, 'bottles'),
            ('Granola Bars', 'Snacks', 80.00, 55.00, 3, 'packs'),
            ('Paper Towels', 'Household', 60.00, 40.00, 9, 'rolls'),
            ('Shampoo', 'Personal Care', 180.00, 120.00, 22, 'bottles'),
            ('Toothpaste', 'Personal Care', 65.00, 40.00, 28, 'tubes'),
            ('Basmati Rice 1kg', 'Grains', 95.00, 65.00, 40, 'bags'),
            ('Canned Beans', 'Canned Goods', 55.00, 35.00, 30, 'cans'),
            ('Butter 200g', 'Dairy', 85.00, 60.00, 14, 'packets'),
            ('Tomato Sauce', 'Condiments', 70.00, 45.00, 25, 'jars'),
            ('Coffee Powder', 'Beverages', 210.00, 150.00, 16, 'jars'),
        ]
        db.executemany('INSERT INTO products (name, category, price, cost_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?)', products)
    db.commit()
