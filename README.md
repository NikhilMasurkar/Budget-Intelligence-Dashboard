# BudgetIQ — Personal Budget Intelligence Dashboard

BudgetIQ is a premium, client-side React web application for personal budget tracking, financial analysis, and AI-powered insights. All data lives in Firebase Firestore (free Spark plan), which also keeps a copy on the device so the app works offline. Hosting, reminders and AI run on free tiers (Netlify, Web Push, Gemini).

---

## Features

### Dashboard
- **Period filter** — select any combination of months, quarters (Q1–Q4), halves (H1/H2), or full year
- **3 KPI insight cards** with animated ring gauges:
  - **Cash Savings** — liquid cash remaining after all expenses (%)
  - **Budget Health** — how many categories are within budget (X/Y on track)
  - **Monthly Burn** — average monthly spend as % of monthly income
- **2 Wealth cards**:
  - **Investments & Savings** — total invested in savings categories with per-item breakdown
  - **Savings Rate** — full calculation breakdown: invested % + cash left % = total wealth-building rate
- **Budget Overview table** — all categories with total spent, period budget, share bar, and status (over/under). Tap any row for a monthly drill-down
- **Charts** — Income vs Expenses monthly bar/line chart + Category spend donut, side by side on desktop

### Transactions
- **Expenses tab** — expenses grouped by collapsible category accordions for the selected month, with add/edit/delete and full category management
- **Money-story summary** — Income · Spent · Saved for the month, with a spend-vs-income progress bar
- **Search & filter** — live search by item name plus a "Fixed only" toggle; matching categories auto-expand
- **Per-category budget** — a compact `Budget ₹spent / ₹limit · %` readout in each category header (amber over 80%, red when exceeded)
- **Comment threads** — a 💬 icon on every row opens a modal of timestamped comments; add new ones inline. Stored as a JSON thread on the expense; legacy single notes still parse
- **Bulk actions** — multi-select rows (or a whole category) to **pin/unpin as fixed, copy to next month, or delete** in one operation
- **Apply across months** — when adding an expense, apply it to this month only, the whole year, or this month → December
- **Last-updated stamp** and a 📌 badge for fixed/recurring items per row
- **Income tab** — income entries by month (salary, freelance, dividend, ITR return, other) as a responsive card list
- Both tabs live under one **Transactions** nav item with a pill switcher

### AI Insights
- Powered by **Google Gemini** — summarises your spending patterns, flags anomalies, and gives personalised suggestions for the selected period

### Security
- **PIN lock** — a 4-digit PIN (stored in Firestore) gates the app after sign-in, verified once per session
- **Biometric unlock** — optional fingerprint/Face ID bypass via the WebAuthn platform authenticator

### Data & Sync
- **Firebase Firestore** is the only database — one document per month holds that month's expenses and income; categories and settings sit beside them
- **Offline** — Firestore's on-device cache: every change made offline is kept and syncs by itself
- **Daily 10 PM reminder** — Web Push, one subscription per device, sent by a Netlify function
- **PWA** — installable on desktop and mobile
- **Mobile-first UI** — responsive accordions/cards, taller touch-friendly rows, and an avatar-only account menu in the header

### Export
- **PDF report** via jsPDF + AutoTable — every year by default, multi-page
- **JSON backup** — all data in one file, the copy you hold outside Firebase

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 + Vite 5 |
| Component library | Material UI (MUI v5) + tss-react |
| Charts | Chart.js + react-chartjs-2 |
| Database | Firebase Firestore |
| Auth | Google sign-in → Firebase Auth |
| AI | Google Gemini API (free tier) |
| PDF | jsPDF + jspdf-autotable |
| PWA | vite-plugin-pwa + Workbox |
| Notifications | react-hot-toast |

---

## Key Metric Definitions

| Metric | Formula |
|---|---|
| **Cash Savings** | Income − All expenses (incl. investments) |
| **Investments & Savings** | Sum of expenses in categories marked as `type: 'savings'` |
| **Savings Rate** | (Investments + Cash Savings) ÷ Income — total wealth-building rate |
| **Budget Health** | Categories where spend ≤ budget × selected months |
| **Monthly Burn** | Total spend ÷ number of selected months |

---

## File Structure

```
budget-app/
├── public/
│   ├── favicon-32x32.png
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── api/
│   │   ├── session.js         # Sign-in, which data root is yours
│   │   ├── store.js           # Expense/income reads and writes
│   │   ├── firestoreMonths.js # Month documents ↔ rows
│   │   ├── firestoreCategories.js   # Firestore category operations
│   │   ├── firestoreSettings.js     # Firestore PIN storage
│   │   ├── pushSubscription.js      # Daily reminder on/off (per device)
│   │   ├── biometric.js       # WebAuthn fingerprint / Face ID unlock
│   │   └── gemini.js          # Gemini AI API calls
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── index.jsx      # Dashboard root — data aggregation, period maths
│   │   │   ├── subcomponents/
│   │   │   │   ├── KPICardsSection.jsx       # 3 ring-gauge insight cards
│   │   │   │   ├── WealthCardsSection.jsx    # Investments + Savings Rate cards
│   │   │   │   ├── BudgetProgressSection.jsx # Unified budget overview table
│   │   │   │   ├── ChartsSection.jsx         # Income vs Expenses + donut charts
│   │   │   │   ├── MonthFilterControl.jsx    # Month/quarter/half/year filter pills
│   │   │   │   ├── AIInsightsSection.jsx     # Gemini AI insights modal
│   │   │   │   └── CategoryDetailsDialog.jsx # Monthly drill-down for a category
│   │   │   └── styles/
│   │   ├── Expenses/
│   │   │   ├── ExpensesByCategory.jsx   # Expenses grouped by category + search/filter/bulk
│   │   │   ├── ExpenseCommentsModal.jsx # Timestamped comment thread per expense
│   │   │   └── AddExpenseModal.jsx
│   │   ├── Income/
│   │   │   ├── IncomeTable.jsx          # Responsive income card list
│   │   │   └── AddIncomeModal.jsx
│   │   ├── Category/
│   │   │   ├── CategoryManager.jsx
│   │   │   └── CategoryModal.jsx
│   │   └── PinScreen.jsx        # PIN setup / entry + biometric unlock gate
│   ├── hooks/
│   │   ├── useAuth.js          # Google → Firebase sign-in / sign-out
│   │   ├── useBudgetData.js    # Loads all expenses, income, categories
│   │   ├── useExpenses.js      # Expense CRUD + bulk operations
│   │   ├── useIncome.js        # Income CRUD
│   │   └── useCategories.js   # Category CRUD + reorder
│   ├── styles/                 # MUI theme + global CSS-in-JS
│   └── utils/
│       ├── constants.js        # MONTHS, formatters (fmt, fmtK), defaultMonths
│       └── exportPdf.js        # jsPDF report layout
├── firebase.js                 # Firebase app init
├── vite.config.js              # Vite + PWA plugin config
└── index.html
```

---

## Installation & Setup

### Prerequisites
- Node.js v18+
- Google OAuth client ID (Web), scopes: openid, email, profile
- Firebase project with **Firestore** and **Google sign-in** enabled; deploy `firestore.rules`
- Google Gemini API key (optional — for AI insights)

### 1. Environment Variables

Create a `.env` file in the project root:

```env
VITE_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
# Server-side (Netlify env): GEMINI_API_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_SECRET, FIREBASE_SERVICE_ACCOUNT_JSON
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

---

## Data Model

Everything lives under `sheets/{sheetId}` (the id is historical: it was the Google Sheet's id; new accounts use their uid). The parent doc holds `ownerUid`, which the security rules check.

### Months (`sheets/{sheetId}/months/{YYYY-MM}`)
`{ year, month, expenses: { [id]: expense }, income: { [id]: income } }`

| Expense field | Type | Notes |
|---|---|---|
| `categoryId` | string | Category id |
| `itemName` | string | Description |
| `amount` | number | INR; negative in a savings category = withdrawal |
| `isFixed` | boolean | Pinned / recurring — auto-copied to the next month |
| `note` | string | JSON comment thread `[{text, ts}]`; legacy plain strings still parse |
| `updatedAt` | string | `'U'`-prefixed epoch ms |

| Income field | Type | Notes |
|---|---|---|
| `source` | string | Salary / Freelance / Dividend / ITR Return / Other |
| `amount` | number | INR |
| `date` | string | `YYYY-MM-DD` |

### Categories (`sheets/{sheetId}/categories/{categoryId}`)
| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name |
| `color` | string | Hex color for charts |
| `budget` | number | Monthly budget limit (INR) |
| `type` | `'expense'`/`'savings'` | Savings type counts toward wealth metrics |
| `order` | number | Display order |

### Push subscriptions (`pushSubscriptions/{sha256(endpoint)}`)
One per device: the browser's subscription plus the owner's `uid`.

---

> Closed years are read-only, in the app and in the security rules (last year stays editable through January).
