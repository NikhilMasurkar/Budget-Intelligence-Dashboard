# BudgetIQ — Personal Budget Intelligence Dashboard

BudgetIQ is a premium, client-side React web application designed for personal budget tracking, financial analysis, and reporting. It offers direct integration with Google Sheets (acting as a secure, personal database) and Google Drive (for real-time Excel report synchronization and live spreadsheet editing).

## Key Features

- **Google OAuth 2.0 Integration**: Secure profile authentication and silent session restoration without backend storage.
- **Google Sheets Database**: Dynamically locates or initializes a personal database spreadsheet (`budgetIQ_Data`) inside the user's Google Drive.
- **Direct Spreadsheet Access**: A single action opens the active database spreadsheet directly in Google Sheets for manual adjustments.
- **Auto-Sync to Google Drive**: Automatically reconciles, formats, and uploads a Microsoft Excel version (`balance_sheet_.xlsx`) to Google Drive after updates.
- **Interactive Dashboard**: Displays clean financial charts (income, expenses, savings rate) using Chart.js, with support for monthly filtering and year selections.
- **Advanced CRUD Management**:
  - **Expenses Table**: Custom categories, amount logging, fixed/variable tracking, and multi-month bulk copying (e.g. copying selected items to next month).
  - **Income Table**: Track salary, freelance, or other earnings.
  - **Category Manager**: Draggable items for custom layout ordering, color picking, and fuzzy matching for automated imports.
- **Reporting & Exporting**: 
  - Save your budget locally as a formatted Microsoft Excel spreadsheet (`.xlsx`) via ExcelJS.
  - Generate a professional-grade, multi-page PDF report (`.pdf`) using jsPDF and AutoTable.
- **Modern UI/UX**: Premium dark-mode design styled using Material-UI (MUI), CSS, and `tss-react` for smooth animations and micro-interactions.

---

## Technical Architecture

### 1. File Structure

```text
budget-app/
├── public/
├── src/
│   ├── api/
│   │   ├── api.js         # Global API registry & endpoint builders
│   │   └── sheets.js      # Sheets & Drive logic/queries (CRUD operations)
│   ├── components/        # UI components (Dashboard, Modals, Forms, Tables)
│   ├── hooks/             # Custom React hooks (useAuth, useBudgetData, useExpenses, useIncome, useCategories)
│   ├── styles/            # Mui Theme custom global styling rules
│   └── utils/
│       ├── constants.js   # Centralized design tokens, helper functions, and matching rules
│       ├── exportExcel.js # Local Excel generation logic
│       ├── exportPdf.js   # Local PDF layout and formatting logic
│       └── parseExcel.js  # Excel parser with fuzzy matching algorithms
```

### 2. Design System & Clean Refactors
- **Centralized API Config ([api.js](src/api/api.js))**: Decouples API endpoints, OAuth configurations, client library scripts, and query builders from the business logic layer.
- **Centralized Constants ([constants.js](src/utils/constants.js))**: Stores design palettes, fonts, margins, uppercase months, and shared string helpers like `toSentenceCase`.
- **Functional Components & Hooks**: Component states and UI interactions are isolated inside domain hooks (e.g. `useExpenses`, `useAuth`) for reusable, clean logic.
- **Functional Error Boundaries**: Modern functional component wrapper around `react-error-boundary` to gracefully handle unexpected runtime errors.

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Google Cloud Project credentials (with Google Sheets & Google Drive APIs enabled).

### 1. Environment Setup
Create a `.env` file in the root directory and specify the Google OAuth Client ID and Google API Key:

```env
VITE_GOOGLE_SHEETS_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY
VITE_GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
```

### 2. Installing Dependencies
Use `npm` to install packages:

```bash
npm install
```

### 3. Run Development Server
Launch Vite development server:

```bash
npm start
```

### 4. Build Production Bundle
Compile code:

```bash
npm run build
```
