# BudgetIQ — Complete Setup Guide

## What you're building
A live budget dashboard connected to YOUR Google Sheet — view, add, edit, delete expenses, and import Excel files — hosted free on Netlify.

---

## STEP 1 — Prepare your Google Sheet

1. Open your Google Sheet (the one with your budget).
2. **Add 3 new tabs** (sheets) with these EXACT names:
   - `Categories`
   - `Expenses`
   - `Income`

3. In the **Categories** tab, add this header row (Row 1):
   ```
   id | name | type | color
   ```

4. In the **Expenses** tab, add this header row:
   ```
   id | year | month | categoryId | itemName | amount | isFixed
   ```

5. In the **Income** tab, add this header row:
   ```
   id | year | month | source | amount
   ```

6. Make the sheet **viewable by anyone with the link**:
   - Share → Change to "Anyone with the link" → Viewer

---

## STEP 2 — Get your Spreadsheet ID

Your Sheet URL looks like:
```
https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXX/edit
```
The `XXXXXXXXXXXXXXXX` part is your **SPREADSHEET_ID**. Copy it.

---

## STEP 3 — Google Cloud Setup (API Key + OAuth)

### 3a. Create a project
1. Go to https://console.cloud.google.com
2. Click "New Project" → name it "BudgetIQ" → Create

### 3b. Enable Google Sheets API
1. In your project → "APIs & Services" → "Library"
2. Search "Google Sheets API" → Enable it

### 3c. Create an API Key (for reading data)
1. "APIs & Services" → "Credentials" → "+ Create Credentials" → "API Key"
2. Copy the key — this is your **SHEETS_API_KEY**
3. Click "Edit" on the key → under "API restrictions" select "Google Sheets API" → Save

### 3d. Create an OAuth 2.0 Client (for writing data)
1. "APIs & Services" → "Credentials" → "+ Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: **Web application**
3. Name: "BudgetIQ"
4. Authorized JavaScript origins — add your Netlify URL AFTER deploying, e.g.:
   ```
   https://your-app-name.netlify.app
   ```
   Also add `http://localhost:5173` for local dev.
5. Click Create — copy the **Client ID** (looks like `xxxxx.apps.googleusercontent.com`)

### 3e. OAuth Consent Screen
1. "APIs & Services" → "OAuth consent screen"
2. User type: External → Create
3. App name: BudgetIQ, support email = your email
4. Scopes → Add `https://www.googleapis.com/auth/spreadsheets`
5. Test users → Add your Gmail address
6. Save

---

## STEP 4 — Create your .env file

In the project root (same folder as package.json), create a file named `.env`:

```env
VITE_GOOGLE_SHEETS_API_KEY=AIza...your_api_key_here
VITE_GOOGLE_SPREADSHEET_ID=1BxiM...your_sheet_id_here
VITE_GOOGLE_OAUTH_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

⚠️  NEVER commit this file to git. It's already in .gitignore.

---

## STEP 5 — Import your existing Excel data

1. Run the app locally first: `npm install && npm run dev`
2. Open http://localhost:5173
3. Click "Sign In to Edit" → sign in with Google
4. Click "⬆ Import" in the top bar
5. Upload your balance_sheet_.xlsx
6. Preview the detected data → click "Import to Google Sheets"

Your data is now live in Google Sheets!

---

## STEP 6 — Deploy to Netlify (free)

### Option A — Netlify CLI (recommended)
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Option B — Netlify UI
1. Go to https://netlify.com → Log in
2. "Add new site" → "Import an existing project" → Connect GitHub
3. Push this folder to a GitHub repo first:
   ```bash
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/YOUR_USERNAME/budget-app.git
   git push -u origin main
   ```
4. In Netlify: pick your repo → Build command: `npm run build` → Publish dir: `dist`
5. **Add environment variables** in Netlify:
   - Site settings → Environment variables → Add all 3 VITE_ vars from your .env

6. After first deploy, copy your Netlify URL (e.g. `https://budget-nik.netlify.app`)
7. Go back to Google Cloud → Credentials → your OAuth client → add this URL to "Authorized JavaScript origins"

---

## STEP 7 — Using the app

| Feature | How |
|---------|-----|
| View dashboard | Works for anyone (read-only, no sign-in needed) |
| Add/Edit/Delete | Click "Sign In to Edit" → Google popup → done |
| Add new expense | Expenses tab → "+ Add Expense" |
| Add new category | Categories tab → "+ Add Category" |
| Copy fixed expenses to next month | Expenses tab → "📋 Copy Fixed → Next Month" |
| Import Excel | Click "⬆ Import" → upload .xlsx |
| Fix wrong data | Click ✏️ Edit on any row |

---

## Data format in your Google Sheet

### Categories tab
| id | name | type | color |
|----|------|------|-------|
| cat_1 | HOME | expense | #6c8fff |
| cat_2 | FINANCIAL OBLIGATIONS | savings | #b97fff |

### Expenses tab
| id | year | month | categoryId | itemName | amount | isFixed |
|----|------|-------|------------|----------|--------|---------|
| exp_001 | 2025 | 1 | cat_1 | Rent | 9000 | TRUE |
| exp_002 | 2025 | 1 | cat_1 | Electric Bill | 680 | FALSE |

`isFixed = TRUE` means the expense will be auto-copied to next month.

### Income tab
| id | year | month | source | amount |
|----|------|-------|--------|--------|
| inc_001 | 2025 | 1 | Salary | 53700 |

---

## Troubleshooting

**"Read failed" error** → Sheet is not set to "Anyone with link can view"

**"Write failed" / 403** → OAuth Client ID is wrong or domain not added to authorized origins

**Empty dashboard** → Headers in your sheet tabs don't match exactly (case-sensitive)

**Sign-in popup blocked** → Allow popups for your Netlify domain in browser settings
