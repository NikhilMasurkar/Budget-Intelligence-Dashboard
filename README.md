# BudgetIQ — Personal Budget Intelligence Dashboard

BudgetIQ is a premium, client-side React web application for personal budget tracking, financial analysis, and AI-powered insights. It uses Google Sheets as a personal cloud database, Firebase Firestore for categories, and Google Drive for automatic Excel backup — all with zero backend server required.

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
- **Expenses tab** — expenses grouped by category for selected month, with add/edit/delete, bulk copy to next month, and category management
- **Income tab** — income entries by month (salary, freelance, dividend, ITR return, other)
- Both tabs live under one **Transactions** nav item with a pill switcher

### AI Insights
- Powered by **Google Gemini** — summarises your spending patterns, flags anomalies, and gives personalised suggestions for the selected period

### Data & Sync
- **Google Sheets** as primary database — `{user} budgetIQ_Data` spreadsheet with Categories, Expenses, and Income tabs
- **Firebase Firestore** for category metadata (name, color, budget, type)
- **Auto-sync to Google Drive** — exports a full `.xlsx` balance sheet after every write
- **PWA** — installable on desktop and mobile, works offline with Workbox service worker

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
│   │   ├── firestoreCategories.js  # Firebase Firestore category operations
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
│   │   │   ├── ExpensesByCategory.jsx  # Expenses grouped by category
│   │   │   ├── ExpenseTable.jsx
│   │   │   └── AddExpenseModal.jsx
│   │   ├── Income/
│   │   │   ├── IncomeTable.jsx
│   │   │   └── AddIncomeModal.jsx
│   │   └── Category/
│   │       ├── CategoryManager.jsx
│   │       └── CategoryModal.jsx
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
| `isFixed` | `'TRUE'`/`'FALSE'` | Recurring flag |

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
