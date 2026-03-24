# 🏎️ HotWheels India — E-Commerce Platform

A full-stack MERN e-commerce application for Hot Wheels die-cast collectibles, featuring a race-themed dark UI, Razorpay payments, printable tax invoices, and a detailed admin dashboard.

![HotWheels](https://i.imgur.com/n5tjHFD.png)

## ✨ Features

### Customer
- 🏎️ Browse & filter Hot Wheels collectibles
- 🛒 Cart with quantity management
- 📦 3-step checkout (Shipping → Payment → Review)
- 🔐 Razorpay payment gateway (UPI, Card, Net Banking, Wallet, EMI)
- 💵 Cash on Delivery option
- 🧾 Printable Tax Invoice (CGST + SGST breakdown)
- 👤 Order history with progress tracker & invoice view
- 🔐 JWT authentication (Register / Login)

### Admin Dashboard
- 📊 KPI cards: Revenue, Orders, Products, Customers, Avg Order Value
- 📈 Order status breakdown chart
- ⚠️ Low-stock & out-of-stock alerts
- 🔍 Product search + stock filter + CRUD
- 📋 Order management with inline status updates
- 🙍 User management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Redux Toolkit |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT |
| Payments | Razorpay |
| Styling | Vanilla CSS (race-themed dark UI) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/hotwheels-ecommerce.git
cd hotwheels-ecommerce
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/hotwheels-ecommerce
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
```

```bash
npm run dev       # Start backend
npm run seed      # Seed sample products & users
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## 🔑 Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hotwheels.com | admin123 |
| User | john@example.com | test123 |

## 💳 Razorpay Test Card
```
Card: 4111 1111 1111 1111
Expiry: Any future date
CVV: 123
```

## 📁 Project Structure

```
├── backend/
│   ├── models/         # User, Product, Order
│   ├── routes/         # auth, products, orders, users, payments
│   ├── middleware/     # JWT auth
│   ├── seeder.js       # Database seed script
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/      # All page components
│   │   ├── components/ # Reusable components
│   │   ├── store/      # Redux slices (auth, cart)
│   │   └── utils/      # Axios instance
│   └── vite.config.js
```

## ⚠️ Environment Variables

Never commit `.env` files. See `.env.example` for reference.

---

Made with ❤️ and 🏎️
