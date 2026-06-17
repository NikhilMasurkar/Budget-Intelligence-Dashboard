# BudgetIQ — Personal Budget Intelligence Dashboard

BudgetIQ is a premium, client-side React web application for personal budget tracking, financial analysis, and AI-powered insights. It uses Google Sheets as a personal cloud database, Firebase Firestore for categories and app-only metadata (pins, comments, PIN lock), and Google Drive for automatic Excel backup — all with zero backend server required.

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
- **Comment threads** — a 💬 icon on every row opens a modal of timestamped comments; add new ones inline. Stored as a JSON thread in the Sheet (column H) and mirrored to Firestore, with backward-compatibility for legacy single notes and recovery of older notes that survive only as Excel cell comments
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
- **Google Sheets** as primary database — `{user} budgetIQ_Data` spreadsheet with Categories, Expenses, and Income tabs
- **Firebase Firestore** for category metadata (name, color, budget, type) and app-only expense metadata — the **pin** (`isFixed`) and **comment thread** (`note`) that the Excel round-trip can't reliably carry, keyed by `year-month-categoryId-itemName`
- **Auto-sync to Google Drive** — exports a full `.xlsx` balance sheet after every write (debounced so rapid edits coalesce into one upload)
- **PWA** — installable on desktop and mobile, works offline with Workbox service worker
- **Mobile-first UI** — responsive accordions/cards, taller touch-friendly rows, and an avatar-only account menu in the header

### Export
- **Excel export** (`.xlsx`) via ExcelJS — formatted balance sheet
- **PDF report** via jsPDF + AutoTable — multi-page professional report
- **Open in Google Sheets** — one-click link to your live spreadsheet

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 + Vite 5 |
| Component library | Material UI (MUI v5) + tss-react |
| Charts | Chart.js + react-chartjs-2 |
| Database | Google Sheets REST API + Firebase Firestore |
| Auth | Google OAuth 2.0 (popup, no backend) |
| AI | Google Gemini API (free tier) |
| Excel | ExcelJS + FileSaver.js |
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
│   │   ├── sheets.js          # Google Sheets + Drive CRUD, OAuth token management
│   │   ├── firestoreCategories.js   # Firestore category operations
│   │   ├── firestoreExpenseMeta.js  # Firestore app-only expense meta (pin + comments)
│   │   ├── firestoreSettings.js     # Firestore PIN storage
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
│   │   ├── useAuth.js          # Google OAuth2 sign-in / sign-out
│   │   ├── useBudgetData.js    # Loads all expenses, income, categories
│   │   ├── useExpenses.js      # Expense CRUD + bulk operations
│   │   ├── useIncome.js        # Income CRUD
│   │   └── useCategories.js   # Category CRUD + reorder
│   ├── styles/                 # MUI theme + global CSS-in-JS
│   └── utils/
│       ├── constants.js        # MONTHS, formatters (fmt, fmtK), defaultMonths
│       ├── exportExcel.js      # ExcelJS export
│       ├── exportPdf.js        # jsPDF report layout
│       └── parseExcel.js       # Excel parser with fuzzy matching
├── firebase.js                 # Firebase app init
├── vite.config.js              # Vite + PWA plugin config
└── index.html
```

---

## Installation & Setup

### Prerequisites
- Node.js v18+
- Google Cloud project with **Google Sheets API** and **Google Drive API** enabled
- Firebase project with **Firestore** enabled
- Google Gemini API key (optional — for AI insights)

### 1. Environment Variables

Create a `.env` file in the project root:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_google_api_key
VITE_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_GEMINI_API_KEY=your_gemini_api_key
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

### Expenses (Google Sheets)
| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID |
| `year` | number | e.g. 2026 |
| `month` | number | 1–12 |
| `categoryId` | string | Firestore category ID |
| `itemName` | string | Description |
| `amount` | number | INR |
| `isFixed` | `'TRUE'`/`'FALSE'` | Recurring flag (mirrored to Firestore) |
| `note` | string | JSON comment thread `[{text, ts}]`; legacy plain strings still parse |
| `updatedAt` | string | `'U'`-prefixed epoch ms (letter prefix keeps Sheets from coercing it to a date) |

### Expense metadata (Firestore — `sheets/{sheetId}/expenseMeta/{key}`)
App-only fields that the Excel backup can't reliably carry. Key = sanitized `year_month_categoryId_itemName`.
| Field | Type | Notes |
|---|---|---|
| `isFixed` | boolean | Pin / recurring flag — Firestore wins on load |
| `note` | string | Comment thread JSON — fallback used only when the Sheet's column H is empty |

### Income (Google Sheets)
| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID |
| `year` | number | |
| `month` | number | 1–12 |
| `source` | string | Salary / Freelance / Dividend / ITR Return / Other |
| `amount` | number | INR |

### Categories (Firestore — `sheets/{sheetId}/categories/{categoryId}`)
| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name |
| `color` | string | Hex color for charts |
| `budget` | number | Monthly budget limit (INR) |
| `type` | `'expense'`/`'savings'` | Savings type counts toward wealth metrics |
| `order` | number | Display order |

---

> Historical years (before current year) are locked as read-only. No data is ever deleted from Google Sheets by the app — only appended or overwritten via the API.
