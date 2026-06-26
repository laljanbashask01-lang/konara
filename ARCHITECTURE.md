# Konara — Complete System Architecture

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KONARA MARKETPLACE                          │
│         "GenAI Multi-Vendor Marketplace with Smart Search"          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Customer │     │  Vendor  │     │ Delivery │     │  Admin   │
│   App    │     │Dashboard │     │  Agent   │     │  Panel   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     └────────────────┴────────────────┴────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   React Frontend   │
                    │  (Vite + Tailwind) │
                    └─────────┬─────────┘
                              │ HTTP/REST API calls
                    ┌─────────▼─────────┐
                    │   FastAPI Backend   │
                    │   (Python 3.12)    │
                    └──┬──────┬───────┬──┘
                       │      │       │
              ┌────────▼┐  ┌──▼───┐  ┌▼────────────┐
              │ MongoDB  │  │Gemini│  │  Razorpay   │
              │  Atlas   │  │ LLM  │  │  Payments   │
              └──────────┘  └──────┘  └─────────────┘
```

## 2. Technology Stack — Why Each Choice

### Frontend
| Technology | Purpose | Why This? |
|-----------|---------|-----------|
| **React 18** | UI framework | Component-based, huge ecosystem, industry standard |
| **Vite** | Build tool | 10x faster than Webpack, instant HMR |
| **TailwindCSS** | Styling | Utility-first, no CSS files to manage, rapid UI development |
| **TanStack Query** | Data fetching | Auto-caching, retry, loading states built-in |
| **React Router** | Navigation | SPA routing, role-based page access |
| **Axios** | HTTP client | Interceptors for auth tokens, cleaner than fetch |

### Backend
| Technology | Purpose | Why This? |
|-----------|---------|-----------|
| **FastAPI** | Web framework | Async, auto-docs (Swagger), type validation, fastest Python framework |
| **Uvicorn** | ASGI server | Async request handling, production-ready |
| **Motor** | MongoDB async driver | Non-blocking DB operations in async FastAPI |
| **Pydantic** | Data validation | Request/response models, auto-validation |
| **PassLib + BCrypt** | Password hashing | Industry standard, salt-based, one-way hashing |
| **python-jose** | JWT tokens | Stateless authentication |
| **httpx** | HTTP client | Async calls to Gemini API |

### Database
| Technology | Purpose | Why This? |
|-----------|---------|-----------|
| **MongoDB Atlas** | Primary database | Document model fits products/orders, geo-queries (2dsphere), text search, free tier |
| **2dsphere Index** | Geo queries | "Find shops within 5km" |
| **Text Index** | Product search | Full-text search on product names |

### AI/GenAI
| Technology | Purpose | Why This? |
|-----------|---------|-----------|
| **Gemini 2.5 Flash** | LLM | Fast, cheap, good at structured output (JSON) |
| **RAG Pattern** | Context-aware AI | Retrieve products from DB → Augment prompt with context → Generate recommendations |
| **Intent Parsing** | NL Search | "ingredients for biryani" → structured query |

### Infrastructure
| Technology | Purpose | Why This? |
|-----------|---------|-----------|
| **Render** | Hosting | Free tier, Docker support, auto-deploy from GitHub |
| **Docker** | Containerization | Consistent environment, multi-stage build (frontend + backend) |
| **GitHub** | Source control | CI/CD trigger for Render, collaboration |

---

## 3. Request Flow — Complete Journey

### A. Customer Searches for "milk"

```
Browser                    React                     FastAPI                  MongoDB                 
   │                         │                         │                        │
   │─── types "milk" ───────▶│                         │                        │
   │                         │── POST /api/search/ ───▶│                        │
   │                         │   {query: "milk"}       │                        │
   │                         │                         │── $text search ───────▶│
   │                         │                         │   {$text: {$search:    │
   │                         │                         │    "milk"}}            │
   │                         │                         │◀── [Milk 1L ₹50,      │
   │                         │                         │     Milk 1L ₹52, ...] │
   │                         │                         │                        │
   │                         │                         │── get vendor locations▶│
   │                         │                         │◀── coordinates ────────│
   │                         │                         │                        │
   │                         │                         │── calc distances       │
   │                         │                         │── sort by price        │
   │                         │◀── {results: [...]} ────│                        │
   │◀── render product cards─│                         │                        │
```

### B. AI Search: "ingredients for biryani" (RAG Pattern)

```
Browser                React              FastAPI              Gemini LLM           MongoDB
   │                     │                   │                     │                   │
   │── "ingredients      │                   │                     │                   │
   │    for biryani" ───▶│                   │                     │                   │
   │                     │── POST /search ──▶│                     │                   │
   │                     │                   │                     │                   │
   │                     │                   │── STEP 1: RETRIEVE ─────────────────────▶│
   │                     │                   │   Get available products                 │
   │                     │                   │◀── [65 products with names] ─────────────│
   │                     │                   │                     │                   │
   │                     │                   │── STEP 2: AUGMENT ─▶│                   │
   │                     │                   │   "Parse this query. │                   │
   │                     │                   │    Available items:  │                   │
   │                     │                   │    [rice, chicken,   │                   │
   │                     │                   │     onion, ...]"     │                   │
   │                     │                   │                     │                   │
   │                     │                   │◀─ STEP 3: GENERATE ─│                   │
   │                     │                   │   {items: ["rice",   │                   │
   │                     │                   │    "chicken","onion",│                   │
   │                     │                   │    "biryani masala"]}│                   │
   │                     │                   │                     │                   │
   │                     │                   │── Search each item ──────────────────────▶│
   │                     │                   │◀── matching products ─────────────────────│
   │                     │                   │                     │                   │
   │                     │◀── {results,       │                     │                   │
   │                     │    ai_expanded:    │                     │                   │
   │                     │    true} ─────────│                     │                   │
   │◀── show expanded ───│                   │                     │                   │
   │    results          │                   │                     │                   │
```

### C. Place Order (Multi-Vendor Split)

```
Customer               FastAPI                    MongoDB                  
   │                      │                          │
   │── POST /orders/ ────▶│                          │
   │   {items: [          │                          │
   │     {milk, qty:2},   │── lookup products ──────▶│
   │     {rice, qty:1},   │◀── product details ──────│
   │     {chicken, qty:1} │                          │
   │   ]}                 │                          │
   │                      │── GROUP BY VENDOR:       │
   │                      │   Vendor A: [milk, rice] │
   │                      │   Vendor B: [chicken]    │
   │                      │                          │
   │                      │── deduct stock ─────────▶│
   │                      │   (findOneAndUpdate)     │
   │                      │                          │
   │                      │── create order ─────────▶│
   │                      │   {sub_orders: [         │
   │                      │     {vendor_A, items..}, │
   │                      │     {vendor_B, items..}  │
   │                      │   ]}                     │
   │                      │                          │
   │◀── {order_id,        │                          │
   │     sub_orders: 2} ──│                          │
   │                      │                          │
   │── POST /payments/ ──▶│── calculate:             │
   │   create-order       │   subtotal + delivery    │
   │                      │   + platform fee (10%)   │
   │◀── payment details ──│                          │
   │                      │                          │
   │── [RAZORPAY POPUP] ──│                          │
   │── verify payment ───▶│── mark as paid ─────────▶│
   │◀── success ──────────│                          │
```

### D. Delivery Flow

```
Vendor A        Vendor B        Delivery Agent       Customer
   │               │                 │                   │
   │── accept ─────│                 │                   │
   │── prepare ────│                 │                   │
   │── READY ──────│                 │                   │
   │               │── accept ───────│                   │
   │               │── prepare ──────│                   │
   │               │── READY ────────│                   │
   │               │                 │                   │
   │               │      ┌──────────▼──────────┐       │
   │               │      │ Order appears in     │       │
   │               │      │ "Available Orders"   │       │
   │               │      └──────────┬──────────┘       │
   │               │                 │                   │
   │               │                 │── ACCEPT          │
   │◀─── pickup ───│◀─── pickup ─────│                   │
   │               │                 │── PICKED UP       │
   │               │                 │── ON THE WAY ────▶│ (status update)
   │               │                 │── DELIVERED ─────▶│ ✅
```

---

## 4. Database Schema

```
┌─────────────────────────────────────────────────┐
│                    MONGODB                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  users {                                         │
│    _id, phone, name, password_hash, role         │
│  }                                               │
│  INDEX: phone (unique)                           │
│                                                  │
│  vendors {                                       │
│    _id, owner_id, shop_name, category,           │
│    location: {type:"Point", coordinates:[lng,lat]},│
│    delivery_radius_km, is_open                   │
│  }                                               │
│  INDEX: owner_id (unique), location (2dsphere)   │
│                                                  │
│  products {                                      │
│    _id, vendor_id, vendor_name, name,            │
│    category, price, stock_qty, image_url         │
│  }                                               │
│  INDEX: vendor_id, name+category (text)          │
│                                                  │
│  orders {                                        │
│    _id, customer_id, sub_orders: [{              │
│      vendor_id, vendor_name, items: [{           │
│        product_id, name, qty, price              │
│      }], status, total                           │
│    }],                                           │
│    location, delivery_agent_id,                  │
│    delivery_status, payment_status,              │
│    total_amount, platform_commission,            │
│    created_at                                    │
│  }                                               │
│  INDEX: customer_id, created_at                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Authentication Flow

```
Register/Login
      │
      ▼
┌─────────────┐     ┌──────────────┐
│  Phone +    │────▶│ BCrypt Hash  │──── stored in MongoDB
│  Password   │     │  (one-way)   │
└─────────────┘     └──────────────┘
      │
      ▼ (on success)
┌─────────────────────────────┐
│  JWT Token Generated         │
│  Payload: {                  │
│    sub: user_id,             │
│    role: "customer/vendor",  │
│    name: "User Name",        │
│    exp: 30 min from now      │
│  }                           │
└──────────────┬──────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Stored in localStorage      │
│  Sent with every request:    │
│  Authorization: Bearer <jwt> │
└──────────────────────────────┘
```

---

## 6. GenAI/RAG Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAG PIPELINE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐  │
│  │ User    │    │ RETRIEVE  │    │ AUGMENT  │    │ GENERATE │  │
│  │ Query   │───▶│ from      │───▶│ prompt + │───▶│ LLM call │  │
│  │         │    │ MongoDB   │    │ context  │    │ (Gemini) │  │
│  └─────────┘    └───────────┘    └──────────┘    └──────────┘  │
│                                                        │         │
│  Features using this pattern:                          ▼         │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 1. NL Search    → Retrieve products → LLM parses    │       │
│  │ 2. Cart Builder → Retrieve stock   → LLM picks items│       │
│  │ 3. Compare      → Retrieve prices  → LLM optimizes  │       │
│  │ 4. Substitution → Retrieve similar → LLM ranks      │       │
│  │ 5. Occasion     → Retrieve catalog → LLM plans      │       │
│  │ 6. Dietary      → Retrieve all     → LLM filters    │       │
│  │ 7. Recommend    → Retrieve history → LLM suggests   │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     RENDER (Docker)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │          Docker Container                   │         │
│  │                                            │         │
│  │  ┌──────────────────────────────────────┐  │         │
│  │  │  Uvicorn (ASGI Server) :8000         │  │         │
│  │  │  ┌────────────────────────────────┐  │  │         │
│  │  │  │  FastAPI Application            │  │  │         │
│  │  │  │  ├── /api/* → JSON responses   │  │  │         │
│  │  │  │  └── /* → React index.html     │  │  │         │
│  │  │  └────────────────────────────────┘  │  │         │
│  │  └──────────────────────────────────────┘  │         │
│  │                                            │         │
│  │  /frontend/dist/ (React build output)      │         │
│  │  /backend/app/   (Python source)           │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
└──────────┬───────────────┬────────────────┬─────────────┘
           │               │                │
           ▼               ▼                ▼
┌──────────────┐  ┌────────────┐  ┌─────────────────┐
│ MongoDB Atlas│  │ Gemini API │  │ Razorpay (future)│
│ (Database)   │  │ (AI/LLM)   │  │ (Payments)       │
└──────────────┘  └────────────┘  └─────────────────┘
```

---

## 8. Payment Flow (Model 2)

```
Customer pays ₹500 order
         │
         ▼
┌─────────────────────────┐
│    Konara Collects ₹530  │  (₹500 + ₹30 delivery)
│    via Razorpay          │
└─────────┬───────────────┘
          │ After delivery confirmed
          ▼
┌─────────────────────────────────────────┐
│  Settlement:                             │
│  ├── Vendor A (rice, onion): ₹180       │
│  │   minus 10% commission = ₹162        │
│  ├── Vendor B (chicken): ₹200           │
│  │   minus 10% commission = ₹180        │
│  ├── Delivery Agent: ₹30 (from fee)    │
│  └── Platform keeps: ₹50+₹30 = ₹80    │
│       (commission + delivery fee markup) │
└─────────────────────────────────────────┘
```

---

## 9. File Structure

```
konara/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           ← FastAPI app, routes, CORS, static files
│   │   ├── database.py       ← MongoDB connection + collections
│   │   ├── models.py         ← Pydantic request/response models
│   │   ├── auth_utils.py     ← JWT, password hashing, middleware
│   │   ├── genai_service.py  ← All LLM/RAG functions (Gemini)
│   │   └── routes/
│   │       ├── auth.py       ← Register, Login
│   │       ├── vendors.py    ← Shop CRUD, geo queries
│   │       ├── products.py   ← Product CRUD
│   │       ├── orders.py     ← Order lifecycle
│   │       ├── search.py     ← Text search + AI search
│   │       ├── ai.py         ← All AI features (cart builder, etc.)
│   │       ├── delivery.py   ← Delivery agent workflows
│   │       └── payments.py   ← Razorpay integration
│   ├── seed_data.py          ← Populate DB with test data
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── main.jsx          ← React entry point
│   │   ├── App.jsx           ← Router + layout
│   │   ├── api.js            ← Axios instance with auth
│   │   ├── components/
│   │   │   └── Navbar.jsx    ← Navigation bar (role-aware)
│   │   └── pages/
│   │       ├── Home.jsx      ← Landing page
│   │       ├── Login.jsx     ← Auth (register/login)
│   │       ├── Search.jsx    ← Product/shop search
│   │       ├── Shop.jsx      ← Individual vendor page
│   │       ├── Cart.jsx      ← Cart + payment
│   │       ├── Orders.jsx    ← Customer order history
│   │       ├── AIAssistant.jsx    ← AI features UI
│   │       ├── VendorDashboard.jsx ← Vendor products
│   │       ├── VendorOrders.jsx    ← Vendor order mgmt
│   │       ├── VendorSetup.jsx     ← Shop registration
│   │       └── DeliveryDashboard.jsx ← Agent deliveries
│   ├── public/               ← Static assets (logo, images)
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                ← Multi-stage build
├── .gitignore
└── README.md
```

---

## 10. Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| MongoDB over PostgreSQL | Flexible schema for products, nested sub-orders, geo-queries built-in |
| JWT over sessions | Stateless auth, works across devices, no server-side session storage |
| FastAPI over Django | Async-native, auto-docs, faster for API-only backends |
| Gemini over ChatGPT | Free tier generous, fast (Flash model), good structured JSON output |
| React over plain JS | Complex UI with many pages/roles, component reuse, ecosystem |
| Docker multi-stage | Frontend build + backend in one container, single Render service |
| RAG over fine-tuning | No training needed, works with any product catalog, real-time data |
| Mock payments | Can demo full flow without Razorpay account, swap to real with one env var |
