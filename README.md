# Konara - GenAI Multi-Vendor Marketplace

A price-comparison marketplace where vendors set their own prices and customers search products — powered by Claude AI for natural language search.

## Stack
- **Backend:** FastAPI + Motor (async MongoDB)
- **Database:** MongoDB Atlas (geo indexes + text search)
- **Frontend:** React + Vite + TailwindCSS + TanStack Query
- **AI:** Claude API for intent parsing (natural language → structured filters)
- **Cache:** Redis (Upstash)
- **Payments:** Razorpay
- **Media:** Cloudinary

## Setup

### Backend
```bash
cd konara/backend
pip install -r requirements.txt
cp .env.example .env  # Fill in your credentials
python -m app.main
```

### Frontend
```bash
cd konara/frontend
npm install
npm run dev
```

## Features
- Vendor registration + product management
- Customer search with price comparison
- AI-powered natural language queries ("ingredients for biryani")
- Geo-based nearby shop discovery
- Multi-vendor cart + order splitting
- Real-time order status
