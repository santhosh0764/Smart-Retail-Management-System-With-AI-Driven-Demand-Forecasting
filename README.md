<<<<<<< HEAD
# StockFlow — Retail Management System

A full-stack retail management system built with **React** (frontend) and **Python Flask + SQLite** (backend).

---

## Features

- 🔐 Authentication (Admin / Staff roles)
- 📦 Product Inventory Management
- 🛒 Billing / POS with receipt generation
- 📊 Analytics with charts (revenue, profit, categories)
- 💰 Profit tracking and margin analysis
- 📄 Report generation (Sales, Inventory, Profit)
- 🤖 AI-powered store insights & demand forecast
- 👥 User management (Admin only)

---

## Project Structure

```
stockflow/
├── backend/
│   ├── app.py           # Flask API server
│   ├── database.py      # SQLite setup & seed data
│   ├── requirements.txt # Python dependencies
│   └── stockflow.db     # SQLite database (auto-created)
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── pages/       # All page components
    │   ├── components/  # Layout, Sidebar
    │   ├── context/     # Auth context
    │   └── index.css    # Global styles
    └── package.json
```

---

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python app.py
```

Backend runs on: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start the React development server
npm start
```

Frontend runs on: **http://localhost:3000**

> The frontend proxies API requests to http://localhost:5000 automatically (configured in package.json).

---

## First Use

1. Open **http://localhost:3000**
2. Click **"Create Account"**
3. Register as **Admin / Owner** for full access
4. Log in and explore the dashboard

---

## User Roles

| Role | Access |
|------|--------|
| Admin / Owner | Full access — all pages |
| Staff Member | Dashboard, Billing/POS, Reports only |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts |
| Backend | Python Flask, SQLite |
| Auth | JWT tokens, bcrypt password hashing |
| Styling | Custom CSS with Google Fonts (DM Sans) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET/POST | /api/products | Get / Add products |
| PUT/DELETE | /api/products/:id | Edit / Delete product |
| POST | /api/sales | Create a sale |
| GET | /api/sales | Get sales history |
| GET | /api/analytics/summary | Dashboard stats |
| GET | /api/analytics/daily | Daily chart data |
| GET | /api/analytics/monthly | Monthly chart data |
| GET | /api/analytics/categories | Sales by category |
| GET | /api/analytics/top-products | Top selling products |
| GET | /api/analytics/top-customers | Top customers |
| GET | /api/analytics/low-stock | Low stock items |
| GET | /api/profit | Profit analysis |
| GET | /api/reports | Generate reports |
| GET | /api/users | List all users (admin) |
| DELETE | /api/users/:id | Delete user (admin) |
| GET | /api/ai/suggestions | AI insights & forecast |
=======
# Smart-Retail-Management-System-With-AI-Driven-Demand-Forecasting
Smart Retail Management System With AI Driven Demand Forecasting Using React + Python
>>>>>>> 0dd864c364fd181b28d754a0c90aec77cf61c0d8
