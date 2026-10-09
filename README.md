# Appzeto Machine Test: E-Commerce Order Processing & Inventory Platform (Task 3)

A production-grade full-stack e-commerce application engineered with atomic concurrency controls, a deterministic order state machine, payment idempotency, background job workers, and role-based administration.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v22.14.0)
- **MongoDB**: Local MongoDB instance on `mongodb://127.0.0.1:27017` or MongoDB Atlas cluster URI.

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds catalog products with size/color variants & admin/customer test accounts
npm run dev      # Runs Express API on http://localhost:3000
```

### 2. Customer Frontend Setup (Port 5173)
```bash
cd ../frontend
npm install
npm run dev      # Runs customer boutique on http://localhost:5173
```

### 3. Dedicated Admin Portal Setup (Port 5174)
```bash
cd ../admin
npm install
npm run dev      # Runs dedicated Admin Console on http://localhost:5174
```

### 4. Docker Compose Setup (Alternative)
```bash
docker-compose up --build
```
> Starts MongoDB (`27017`), Backend (`3000`), Customer Store (`5173`), and Admin Operations Console (`5174`).

---

## 🔑 Demo & Test Credentials

The database seeder automatically creates pre-configured accounts:

| Role | Email | Password | Access & Port |
|---|---|---|---|
| **ADMIN** | `admin@appzeto.com` | `Admin@1234` | Dedicated Admin Portal (`http://localhost:5174`): Metrics matching dashboard UI, state machine transitions, Multer image upload, variant creator, mock webhook console |
| **CUSTOMER** | `user@appzeto.com` | `User@1234` | Customer Store (`http://localhost:5173`): Registration, login, profile & address management, luxury catalog, multi-variant cart, atomic checkout |

---

## ⚙️ Environment Variables

Defined in `.env.example` and `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/appzeto_ecommerce
MONGODB_URL=mongodb+srv://...               # Optional MongoDB Atlas connection string fallback
JWT_SECRET=supersecretjwtkeyappzeto2026
CLIENT_URL=http://localhost:5173
RESERVATION_TTL_MINUTES=15                 # Expired order stock reclamation threshold
```

---

## 🏗️ System Architecture & Best Practices

```
project/
├── backend/
│   ├── config/              # Database connection with cluster fallback
│   ├── controllers/         # Auth, Cart, Product, Order, Payment, Admin controllers
│   ├── middleware/          # JWT protect, adminOnly RBAC, uploadMiddleware (Multer)
│   ├── models/              # User, Product, Cart, Order, PaymentLog, WebhookLog
│   ├── routes/              # Auth, Product, Cart, Order, Payment, Webhook, Upload (Multer)
│   ├── services/
│   │   ├── checkoutService.js      # Atomic inventory reservation & rollback logic
│   │   ├── orderStateMachine.js   # Deterministic state lifecycle validator
│   │   └── backgroundJobs.js       # Periodic worker for expired stock & email jobs
│   ├── uploads/             # Multer static file storage (served on /uploads)
│   ├── scripts/             # seed.js (Variants, realistic products, initial accounts)
│   └── tests/               # Vitest suite (state machine, pricing, 20 concurrent requests)
├── frontend/                # Customer Store (Port 5173) - Warm editorial boutique
│   ├── src/
│   │   ├── components/      # Navbar (Zero admin links), Footer, OrderStepper
│   │   ├── context/         # AuthContext (Working login/signup), CartContext, ToastContext
│   │   ├── lib/             # api.js client (Supports JSON & FormData)
│   │   ├── styles/          # index.css (Warm terracotta #d34b26, Playfair Display)
│   │   └── views/           # CatalogView, ProductDetailView, CartView, CheckoutView, AuthView, ProfileView
│   └── vite.config.js       # Vite build & proxy settings
├── admin/                   # Dedicated Admin Portal (Port 5174) - Purple & light theme
│   ├── src/
│   │   ├── components/      # Metrics cards, Recent orders table, State machine modal
│   │   ├── lib/             # api.js client (Bearer token auth & Multer uploadApi)
│   │   ├── styles/          # admin.css (Matches screenshot: purple #7c3aed, clean cards)
│   │   └── App.jsx          # Dashboard, Order transitions, Multer upload product modal, Webhooks
│   └── vite.config.js       # Runs on port 5174
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## ⚡ Concurrency & Inventory Consistency Strategy

### The Problem
If a product has only 5 units in stock and 20 users attempt to checkout at the exact same millisecond, simple read-then-write updates (`if product.stock >= qty then product.stock -= qty`) will cause race conditions and overselling (negative stock).

### Our Solution
1. **Atomic Conditional Updates**:
   Inventory reservation executes using MongoDB's atomic find-and-modify operator:
   ```javascript
   Product.findOneAndUpdate(
     { _id: productId, isActive: true, stock: { $gte: quantity } },
     { $inc: { stock: -quantity } },
     { new: true }
   );
   ```
   Because document-level writes are serialized in the storage engine (WiredTiger), the query filter `{ stock: { $gte: quantity } }` evaluates atomically. Only requests where stock is genuinely available succeed.
2. **Support for Both Replica Sets & Standalone MongoDB**:
   - In replica set environments (Atlas, clustered Mongo), transactions wrap multi-item carts.
   - On standalone local dev databases where replica sets are absent, `checkoutService` applies atomic conditional decrements with automatic compensation rollback if any subsequent item in the cart fails.
3. **Automated Concurrency Proof**:
   Run `npm test` in `backend` to run `tests/integration/concurrency.test.js`. It fires **20 concurrent requests** against a product with stock = 5, verifying that **exactly 5 succeed, 15 fail, stock = 0, and inventory never becomes negative**.

---

## 🔄 Order Lifecycle State Machine

Deterministic state transitions prevent illegal states (e.g., `DELIVERED` cannot revert to `PENDING`):

```
PENDING
   │
   ▼
PAYMENT_PROCESSING
   │
   ▼
PAID
   │
   ▼
PROCESSING
   │
   ▼
SHIPPED
   │
   ▼
DELIVERED

Failure & Terminal States:
   ├── PAYMENT_FAILED  (Allows retry to PAYMENT_PROCESSING or CANCELLED)
   ├── CANCELLED       (Restores inventory back to catalog)
   └── REFUNDED        (From PAID, PROCESSING, SHIPPED, DELIVERED; restores inventory)
```

- Invalid transitions throw `400 Bad Request` server-side.
- State changes to `CANCELLED` or `REFUNDED` automatically increment stock back to the product/variants.

---

## 💳 Payment Simulation & Webhook Idempotency

### 1. Payment Simulation (`POST /api/payments`)
Supports 3 simulated gateway outcomes via header `Idempotency-Key`:
- `SUCCESS`: Advances order to `PAID`, sets `paidAt`, enqueues order confirmation email.
- `FAILED`: Transitions order to `PAYMENT_FAILED`, leaving reservation open for retry or cancellation.
- `TIMEOUT`: Sets `paymentStatus = "TIMEOUT"` while keeping order in `PAYMENT_PROCESSING` awaiting webhook.

### 2. Idempotent Payment Webhook (`POST /api/webhooks/payment`)
- Gateways often retry webhook delivery upon network delays.
- Our endpoint logs incoming `eventId` into `WebhookLog`.
- If a webhook with the same `eventId` is delivered a second time, the server returns `200 OK` with `{ replayed: true }` without re-processing payment effects.

---

## 🗄️ Database Design & Indexing Strategy

| Collection | Key Fields | Indexes | Purpose |
|---|---|---|---|
| `users` | `email`, `role`, `addresses` | `{ email: 1 }` (unique) | Fast auth lookups & duplicate email prevention |
| `products` | `sku`, `price`, `stock`, `variants` | `{ sku: 1 }` (unique), `{ category: 1, isActive: 1 }`, `{ name: "text", description: "text" }` | High-speed category browsing and full-text keyword search |
| `orders` | `user`, `status`, `idempotencyKey` | `{ user: 1, idempotencyKey: 1 }` (unique), `{ status: 1, createdAt: -1 }` | Prevents duplicate checkouts and accelerates admin timeline queries |
| `paymentlogs`| `idempotencyKey`, `order` | `{ idempotencyKey: 1 }` (unique) | Prevents duplicate card charge side effects |
| `webhooklogs`| `eventId` | `{ eventId: 1 }` (unique) | Guarantees idempotent webhook ingestion |

---

## 🛡️ Security Considerations

1. **Mass Assignment Prevention**: All request payloads are strictly validated using `zod` with `.strict()`, rejecting unpermitted fields.
2. **Injection Resistance**: Uses Mongoose schema typing and parameterized queries; no raw SQL/NoSQL concatenation.
3. **HTTP Headers & Rate Limiting**: `helmet` security headers configured; `express-rate-limit` enforces rate capping on `/api`.
4. **Credential Security**: Passwords hashed with `bcryptjs` (salt rounds 12); password field explicitly marked `select: false`.
5. **Server-Side Price Calculation**: Frontend prices are strictly ignored; all subtotal, discount, 5% tax, and shipping calculations are derived on the server.

---

## 🧪 Automated Testing Suite

Run tests via Vitest:
```bash
cd backend
npm test
```

### Coverage:
1. `orderStateMachine.test.js`: Validates all forward lifecycle transitions, rejects invalid backward transitions (DELIVERED → PENDING), and verifies terminal states.
2. `pricing.test.js`: Unit tests flat/percentage discount calculation, 5% tax calculations, and 2-decimal money rounding.
3. `concurrency.test.js`: Integration test for 20 concurrent purchase requests competing for 5 inventory units.

---

## ⚠️ Known Limitations & Future Improvements

### Known Limitations
1. In-memory queue fallback is utilized when Redis is not running locally.
2. Payment gateway is simulated for test evaluation rather than connected to live Stripe/Razorpay credentials.

### What Would Be Improved with 2 More Days:
1. **Distributed Locks (Redlock / Redis)**: Add Redis-backed distributed locks for distributed multi-instance horizontal scaling.
2. **Event-Driven Messaging (BullMQ / Kafka)**: Connect BullMQ with Redis cluster for robust retry mechanisms on failed email dispatches.
3. **Elasticsearch / Algolia**: Implement typo-tolerant search across millions of SKUs and faceted variant filtering.
4. **Automated E2E Playwright Tests**: Full end-to-end browser regression tests covering cart drawer, checkout, and webhook simulator.
