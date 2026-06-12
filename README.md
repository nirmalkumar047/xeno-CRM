# 🍔 BiteLoop CRM

> **AI-Native Mini CRM for Reaching Shoppers**

**Tagline:** *Every bite, a loop back to you.*

---

## 🔗 Quick Links

| Resource | Link |
|---|---|
| 🌐 **Live Product (Frontend)** | [https://biteloop-crm.vercel.app](#) |
| ⚙️ **CRM Backend API** | [https://biteloop-crm-backend.onrender.com](#) |
| 📡 **Channel Stub Service** | [https://biteloop-channel-stub.onrender.com](#) |
| 🎥 **Walkthrough Video (5-6 min)** | [Watch on YouTube/Loom](#) |
| 📂 **Repository** | You're here! |

---

## 📖 Overview

**BiteLoop CRM** is a chat-first, AI-native marketing platform built for **BiteLoop**, a fictional fast-food brand created specifically for this assignment.

The core problem this product solves: marketers spend significant time manually building audience segments and writing campaign copy. BiteLoop CRM removes that friction — a marketer simply describes their intent in plain English, and AI handles the rest.

> *"Reach customers who haven't ordered in 30 days with a win-back offer"*

The AI parses this into structured **segment rules**, drafts a **personalised campaign message**, and presents both as one-click-to-save action cards. The marketer reviews, hits send, and watches delivery stats update live through an async callback loop.

### What This Is
- ✅ A marketing/engagement CRM for reaching shoppers via Email, SMS, WhatsApp (simulated)
- ✅ AI woven into the core product experience, not bolted on
- ✅ A full simulation of real-world async message delivery (delivered → opened → clicked)

### What This Isn't
- ❌ Not a sales/support CRM (no deals, pipelines, tickets)
- ❌ Doesn't integrate real messaging providers (per assignment requirements — see Channel Stub below)

---

## ✨ Core Features

| Feature | Description |
|---|---|
| **AI Campaign Builder** | Chat interface — describe your audience and goal in natural language; AI builds the segment and drafts the message |
| **Customer Management** | Ingested customer base with order history, spend, favourite items, location |
| **Segment Builder** | Rule-based audience targeting (manual UI + AI-generated) with live preview |
| **Campaign Management** | Create, draft, and send personalised campaigns |
| **Delivery Simulation** | Separate Channel Stub service simulates the full async delivery lifecycle |
| **Live Analytics** | Real-time delivery funnel, open/click rates, per-campaign breakdowns |
| **Authentication** | Firebase Auth — email/password sign-in |

---

## 🏗️ Architecture
<img width="1280" height="700" alt="biteloop-architecture" src="https://github.com/user-attachments/assets/aabd1a52-7fc8-4fc5-ae61-fd8577f9f4dd" />

![this is the img](<img width="1280" height="700" alt="biteloop-architecture" src="https://github.com/user-attachments/assets/19c5b7ea-edc2-4045-8144-e5545d88d31d" />
)

### High-Level Flow
React Frontend (Vercel)
│  Firebase Auth ID Token
▼
CRM Backend (Render) — Node.js + Express
│
├──► Firestore (customers, segments, campaigns, messages)
├──► Groq API (llama-3.3-70b) — AI chat, segment parsing, message drafting
│
└──► Channel Stub Service (Render) — POST /send
│
└──► Async callbacks → CRM /api/receipts/callback
(delivered → opened → clicked, with retries)

### Message Delivery Lifecycle

This is the core system-design piece of the assignment — a two-service, callback-driven loop modeling how real messaging providers (Twilio, SendGrid, etc.) work:

1. CRM creates a `message` record per recipient (status: `queued`) and responds to the user **immediately**
2. CRM asynchronously calls the Channel Stub's `POST /send` with recipient + message details + a callback URL
3. Stub acknowledges instantly, then **simulates outcomes** with randomized delays:
   - **Delivered** — 92% probability, after 1–4s
   - **Opened** — 45% probability (of delivered), after 3–10s
   - **Clicked** — 28% probability (of opened), after 8–18s
4. Each event fires a callback to `POST /api/receipts/callback` with retry logic (3 attempts, exponential backoff)
5. CRM updates the message status and atomically increments campaign stats
6. Frontend polls the campaign detail page every 4s while status is `sending`, showing live-updating stats

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Channel Stub | Standalone Express service |
| Deployment | Vercel (frontend) + Render (backends) |

---

## 📁 Project Structure
biteloop-crm/
├── crm-backend/              # Main CRM API
│   ├── src/
│   │   ├── config/           # Firebase Admin setup
│   │   ├── controllers/       # customers, segments, campaigns, receipts, analytics, ai
│   │   ├── middleware/        # Firebase auth middleware
│   │   ├── routes/
│   │   └── scripts/seed.js    # Seeds 100 customers + orders
│   └── package.json
│
├── channel-stub/              # Simulated delivery service
│   └── src/index.js           # Async lifecycle simulator with retries
│
├── frontend/                   # React app
│   └── src/
│       ├── components/
│       ├── hooks/useAuth.jsx
│       ├── lib/                # api.js, firebase.js
│       └── pages/              # Dashboard, AIChat, Customers, Segments, Campaigns, Analytics
│
├── render.yaml
└── biteloop-architecture.png

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+
- A Firebase project (Firestore + Email/Password Auth enabled)
- A free Groq API key from [console.groq.com](https://console.groq.com)

### 1. CRM Backend
```bash
cd crm-backend
npm install
cp .env.example .env
# Add your Firebase service account + Groq API key
npm run seed     # seeds 100 BiteLoop customers + orders
npm run dev      # http://localhost:4000
```

### 2. Channel Stub
```bash
cd channel-stub
npm install
cp .env.example .env
npm run dev      # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Add your Firebase web config + API URL
npm run dev      # http://localhost:5173
```

---

## 🤖 AI-Native Approach

AI isn't an add-on feature — it's the primary interaction model:

- **Chat-First Campaign Builder**: marketers describe intent in natural language; Groq's `llama-3.3-70b` converts this into structured segment rules (`{field, operator, value}`) and drafts on-brand campaign copy with personalization placeholders (`{firstName}`, `{favouriteItem}`)
- **One-click actions**: AI responses include actionable cards to save segments/campaigns directly from the chat
- **AI Draft Assist**: even in the manual campaign builder, an "AI Draft Message" button generates copy based on the selected segment

---

## ⚖️ Key Tradeoffs & Design Decisions

| Decision | Reasoning | At Scale |
|---|---|---|
| **Firestore over SQL** | Fast setup, native Firebase Auth integration | Move to PostgreSQL with indexed columns for complex segment queries |
| **In-memory segment filtering** | Firestore can't do multi-field AND range queries natively; fine at 100s of customers | Precompute `segmentIds[]` on each customer doc via background jobs |
| **Polling for live stats (4s interval)** | Simple, no persistent connections | Firestore `onSnapshot` listeners or SSE for true real-time updates |
| **Send endpoint returns immediately** | Mirrors real async messaging providers; doesn't block on delivery | Add a proper job queue (BullMQ/SQS) for dispatch at high volume |
| **Stub retries in-process (setTimeout)** | Simple to implement and reason about | Move to a queue with dead-letter handling for reliability at scale |
| **Custom fictional brand (BiteLoop)** | Avoids IP concerns, fully original seed data and copy | N/A |

---

## 📊 Simulated Delivery Rates

| Event | Probability |
|---|---|
| Delivered | 92% |
| Opened (of delivered) | 45% |
| Clicked (of opened) | 28% |
| Failed | 8% |

---

## 🔮 What I'd Add at Scale

- Queue-based campaign dispatch for large recipient lists
- Background segment pre-computation
- Real-time Firestore listeners instead of polling
- A/B message testing
- Unsubscribe/opt-out management per channel
- Timezone-aware campaign scheduling
- Multi-tenant support for multiple brands

---

## 👤 Author

**Nirmal Kumar (Akkinapalli Nirmal Kumar)**
Computer Science, SRM Institute of Science and Technology
Built for the Xeno Engineering Assignment, June 2026
