// ============================================================
//  Google Sheets API — Budget Dashboard
//  All secrets go in .env — never hardcode keys
// ============================================================

import { API_CONFIG } from './api'

let _sheetId = null
export const getSheetId = () => _sheetId
export const setSheetId = (id) => {
  _sheetId = id
  localStorage.setItem('budgetiq_sheetId', id || '')
  _cache.clear()
}

// ─── IN-MEMORY CACHE (full-tab reads only) ───────────────────
const _cache = new Map()
function _invalidate(tab) { _cache.delete(tab) }

export const TABS = {
  CATEGORIES: 'Categories',
  EXPENSES:   'Expenses',
  INCOME:     'Income',
}

// ─── LOW-LEVEL READ (Needs OAuth token if restricted) ───
async function readRange(tab, range = '', token) {
  if (!_sheetId) throw new Error('No spreadsheet ID set')
  if (!range && _cache.has(tab)) return _cache.get(tab)
  const fullRange = range ? `${tab}!${range}` : tab
  const url = API_CONFIG.SHEET.getValuesUrl(_sheetId, fullRange, API_CONFIG.API_KEY)
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || 'Read failed') }
  const rows = (await res.json()).values || []
  if (!range) _cache.set(tab, rows)
  return rows
}

// ─── LOW-LEVEL WRITE (needs OAuth token) ────────────────────
async function writeRange(tab, startCell, values, token) {
  if (!_sheetId) throw new Error('No spreadsheet ID set')
  const range = `${tab}!${startCell}`
  const url   = API_CONFIG.SHEET.getValuesUrl(_sheetId, range, API_CONFIG.API_KEY) + '&valueInputOption=USER_ENTERED'
  const res   = await fetch(url, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ range, majorDimension: 'ROWS', values })
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || 'Write failed') }
  _invalidate(tab)
  return res.json()
}

export async function appendRows(tab, values, token) {
  if (!_sheetId) throw new Error('No spreadsheet ID set')
  const url = API_CONFIG.SHEET.getAppendUrl(_sheetId, tab, API_CONFIG.API_KEY)
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ majorDimension: 'ROWS', values })
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || 'Append failed') }
  _invalidate(tab)
  return res.json()
}

async function clearAndWrite(tab, values, token) {
  if (!_sheetId) throw new Error('No spreadsheet ID set')
  _invalidate(tab)
  const clearUrl = API_CONFIG.SHEET.getClearUrl(_sheetId, tab, API_CONFIG.API_KEY)
  await fetch(clearUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: '{}' })
  if (values.length > 0) await writeRange(tab, 'A2', values, token)
}

// ─── GOOGLE OAUTH (popup, no backend needed) ────────────────
const CLIENT_ID = API_CONFIG.OAUTH.CLIENT_ID
const SCOPES    = API_CONFIG.OAUTH.SCOPES
let _token = null, _exp = 0

// ─── PERSISTENCE ────────────────────────────────────────────
function _persist() {
  localStorage.setItem('budgetiq_sheetId', _sheetId || '')
}
function _restore() {
  _sheetId = localStorage.getItem('budgetiq_sheetId') || null
  // Clean up stale keys written by an older version of this app
  localStorage.removeItem('budgetiq_token')
  localStorage.removeItem('budgetiq_exp')
}
_restore() // run on module load

export const getToken   = () => (Date.now() < _exp ? _token : null)
export const isSignedIn = () => !!getToken()
export const getSavedUserName = () => localStorage.getItem('budgetiq_userName') || null

function _loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const s = document.createElement('script')
    s.src = API_CONFIG.OAUTH.GSI_SCRIPT
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load Google Identity'))
    document.head.appendChild(s)
  })
}

export function signInWithGoogle() {
  return new Promise(async (resolve, reject) => {
    try { await _loadGsi() } catch (e) { reject(e); return }
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      callback:  r => {
        if (r.error) { reject(r.error); return }
        _token = r.access_token
        const expiresIn = parseInt(r.expires_in, 10) || 3600
        _exp   = Date.now() + expiresIn * 1000
        _persist()
        resolve(_token)
      }
    }).requestAccessToken()
  })
}

// Silent re-auth — no popup if user already granted consent
export function silentReauth() {
  return new Promise(async (resolve, reject) => {
    try { await _loadGsi() } catch (e) { reject(e); return }
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      prompt:    '',
      callback:  r => {
        if (r.error) { reject(r.error); return }
        _token = r.access_token
        const expiresIn = parseInt(r.expires_in, 10) || 3600
        _exp   = Date.now() + expiresIn * 1000
        _persist()
        resolve(_token)
      }
    }).requestAccessToken()
  })
}

export function signOut() {
  if (_token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(_token)
  _token = null; _exp = 0; _sheetId = null
  _cache.clear()
  localStorage.removeItem('budgetiq_sheetId')
  localStorage.removeItem('budgetiq_userName')
  localStorage.removeItem('budgetiq_userPicture')
}

// ─── DRIVE FILE MANAGEMENT ──────────────────────────────────
export async function getUserProfile(token) {
  const res = await fetch(API_CONFIG.OAUTH.USER_INFO, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Failed to get user profile')
  return res.json()
}

// ─── GET DRIVE FILE VIEW URL ─────────────────────────────────
// Returns the Google Drive view URL for the user's balance_sheet_.xlsx.
// On mobile, this URL opens directly in the Drive/Sheets app if installed.
export async function getDriveExcelUrl(token, userName) {
  const query = userName
    ? `name='${userName} balance_sheet_.xlsx' and trashed=false`
    : `name contains 'balance_sheet_' and trashed=false and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`
  const res = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || 'Drive search failed') }
  const data = await res.json()
  if (!data.files || data.files.length === 0) return null
  return `https://drive.google.com/file/d/${data.files[0].id}/view`
}

// ─── DOWNLOAD EXCEL FROM DRIVE ───────────────────────────────
// Finds balance_sheet_.xlsx from Drive using the same naming as uploadExcelToDrive:
//   filename = "${userName} balance_sheet_.xlsx"
export async function downloadExcelFromDrive(token, userName) {
  // Use exact name match if we know the user, else fall back to contains search
  const query = userName
    ? `name='${userName} balance_sheet_.xlsx' and trashed=false`
    : `name contains 'balance_sheet_' and trashed=false and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`

  const searchUrl = API_CONFIG.DRIVE.getFilesUrl(query, 'files(id,name,modifiedTime)', 5) + '&orderBy=modifiedTime+desc'
  const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!searchRes.ok) {
    const e = await searchRes.json()
    throw new Error(e?.error?.message || 'Failed to search Drive for Excel')
  }
  const data = await searchRes.json()
  if (!data.files || data.files.length === 0) {
    console.warn(`[Drive] No file found for query: ${query}`)
    return null
  }

  const fileId = data.files[0].id

  const dlUrl = API_CONFIG.DRIVE.getDownloadUrl(fileId)
  const dlRes  = await fetch(dlUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!dlRes.ok) {
    const e = await dlRes.json()
    throw new Error(e?.error?.message || 'Failed to download Excel from Drive')
  }
  return dlRes.arrayBuffer()
}

export async function findUserSpreadsheet(token, userName) {
  const query = `name='${userName} budgetIQ_Data' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  const url = API_CONFIG.DRIVE.getFilesUrl(query)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e?.error?.message || 'Failed to search Drive')
  }
  const data = await res.json()
  return data.files && data.files.length > 0 ? data.files[0].id : null
}

export async function createUserSpreadsheet(token, userName) {
  const res = await fetch(API_CONFIG.SHEET.BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ properties: { title: `${userName} budgetIQ_Data` } })
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e?.error?.message || 'Failed to create spreadsheet')
  }
  const data = await res.json()
  return data.spreadsheetId
}

export async function uploadExcelToDrive(buffer, userName, token) {
  const fileName = `${userName} balance_sheet_.xlsx`
  
  // 1. Search for existing file
  const query = `name='${fileName}' and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and trashed=false`
  const searchUrl = API_CONFIG.DRIVE.getFilesUrl(query)
  const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } })
  if (!searchRes.ok) {
    const e = await searchRes.json()
    throw new Error(e?.error?.message || 'Failed to search Drive for Excel file')
  }
  const searchData = await searchRes.json()
  const existingId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null

  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

  if (existingId) {
    // 2a. Overwrite existing file
    const uploadUrl = API_CONFIG.DRIVE.getUploadUrl(existingId)
    const uploadRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        Authorization: `Bearer ${token}`
      },
      body: blob
    })
    if (!uploadRes.ok) {
      const e = await uploadRes.json()
      throw new Error(e?.error?.message || 'Failed to update Excel in Drive')
    }
    return existingId
  } else {
    // 2b. Create new file with multipart upload
    const metadata = { name: fileName, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', blob)

    const createRes = await fetch(API_CONFIG.DRIVE.getUploadUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    })
    if (!createRes.ok) {
      const e = await createRes.json()
      throw new Error(e?.error?.message || 'Failed to upload Excel to Drive')
    }
    const createData = await createRes.json()
    return createData.id
  }
}

// ─── HELPERS ────────────────────────────────────────────────
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return []
  const [sheetHeaders, ...data] = rows
  const headers = [...sheetHeaders]
  if (headers.includes('categoryId') && !headers.includes('note')) headers.push('note')
  return data.map(r => {
    const validEntries = []
    headers.forEach((h, i) => { if (h) validEntries.push([h, r[i] ?? '']) })
    return Object.fromEntries(validEntries)
  })
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ─── CATEGORIES ─────────────────────────────────────────────
export async function fetchCategories(token) {
  return rowsToObjects(await readRange(TABS.CATEGORIES, '', token))
}

export async function saveCategory(cat, token) {
  const all = rowsToObjects(await readRange(TABS.CATEGORIES, '', token))
  const idx = all.findIndex(c => c.id === cat.id)
  const row = [cat.id || uid(), cat.name, cat.type, cat.color || '#6c8fff']
  if (idx >= 0) await writeRange(TABS.CATEGORIES, `A${idx + 2}`, [row], token)
  else           await appendRows(TABS.CATEGORIES, [row], token)
}

export async function deleteCategory(catId, token) {
  const all = rowsToObjects(await readRange(TABS.CATEGORIES, '', token))
  await clearAndWrite(TABS.CATEGORIES, all.filter(c => c.id !== catId).map(c => [c.id, c.name, c.type, c.color]), token)
}

export async function reorderCategories(orderedCats, token) {
  await clearAndWrite(TABS.CATEGORIES, orderedCats.map(c => [c.id, c.name, c.type, c.color]), token)
}

// ─── EXPENSES ───────────────────────────────────────────────
export async function fetchExpenses(year, token) {
  const rawRows = await readRange(TABS.EXPENSES, '', token)
  
  
  const all = rowsToObjects(rawRows)
  
  if (year) {
    const filtered = all.filter(e => String(e.year) === String(year))
    return filtered
  }else  return all
}

export async function saveExpense(exp, token) {
  const all = rowsToObjects(await readRange(TABS.EXPENSES, '', token))
  const idx = all.findIndex(e => e.id === exp.id)
  const row = [exp.id || uid(), String(exp.year), String(exp.month), exp.categoryId, exp.itemName, exp.amount, exp.isFixed ? 'TRUE' : 'FALSE', exp.note || '']
  if (idx >= 0) await writeRange(TABS.EXPENSES, `A${idx + 2}`, [row], token)
  else           await appendRows(TABS.EXPENSES, [row], token)
}

export async function deleteExpense(expId, token) {
  const all = rowsToObjects(await readRange(TABS.EXPENSES, '', token))
  await clearAndWrite(TABS.EXPENSES, all.filter(e => e.id !== expId).map(e => [e.id, String(e.year), String(e.month), e.categoryId, e.itemName, e.amount, e.isFixed, e.note || '']), token)
}

export async function copyExpensesToNextMonth(fromYear, fromMonth, selectedIds, token) {
  const all    = rowsToObjects(await readRange(TABS.EXPENSES, '', token))
  const selected = all.filter(e => selectedIds.includes(e.id))
  let toYear   = parseInt(fromYear), toMonth = parseInt(fromMonth) + 1
  if (toMonth > 12) { toMonth = 1; toYear++ }
  const exist  = all.filter(e => String(e.year) === String(toYear) && String(e.month) === String(toMonth))
  const newRows = selected
    .filter(f => !exist.some(x => x.categoryId === f.categoryId && x.itemName === f.itemName))
    .map(f => [uid(), String(toYear), String(toMonth), f.categoryId, f.itemName, f.amount, 'FALSE', f.note || ''])
  if (newRows.length) await appendRows(TABS.EXPENSES, newRows, token)
  return { copied: newRows.length, toYear, toMonth }
}

// Copies all isFixed='TRUE' expenses from the month before toYear/toMonth into that month.
// Skips expenses that already exist there (same categoryId + itemName). Returns count copied.
export async function autoFixedCopyToMonth(toYear, toMonth, token) {
  const allRows = await readAllExpenseRows(token)
  let prevY = toYear, prevM = toMonth - 1
  if (prevM === 0) { prevM = 12; prevY-- }

  const fixedRows = allRows.filter(r =>
    String(r[1]) === String(prevY) &&
    String(r[2]) === String(prevM) &&
    r[6] === 'TRUE'
  )
  if (!fixedRows.length) return 0

  const destRows = allRows.filter(r => String(r[1]) === String(toYear) && String(r[2]) === String(toMonth))
  const newRows = fixedRows
    .filter(f => !destRows.some(d => d[3] === f[3] && d[4] === f[4]))
    .map(f => [uid(), String(toYear), String(toMonth), f[3], f[4], f[5], 'TRUE', f[7] || ''])

  if (newRows.length) await appendRows(TABS.EXPENSES, newRows, token)
  return newRows.length
}

// ─── INCOME ─────────────────────────────────────────────────
export async function fetchIncome(year, token) {
  const all = rowsToObjects(await readRange(TABS.INCOME, '', token))
  return year ? all.filter(i => String(i.year) === String(year)) : all
}

export async function saveIncome(inc, token) {
  const all = rowsToObjects(await readRange(TABS.INCOME, '', token))
  const idx = all.findIndex(i => i.id === inc.id)
  const row = [inc.id || uid(), String(inc.year), String(inc.month), inc.source, inc.amount]
  if (idx >= 0) await writeRange(TABS.INCOME, `A${idx + 2}`, [row], token)
  else           await appendRows(TABS.INCOME, [row], token)
}

export async function deleteIncome(incId, token) {
  const all = rowsToObjects(await readRange(TABS.INCOME, '', token))
  await clearAndWrite(TABS.INCOME, all.filter(i => i.id !== incId).map(i => [i.id, String(i.year), String(i.month), i.source, i.amount]), token)
}

// ─── BATCH READ/WRITE (for multi-month saves) ──────────────
export async function readAllExpenseRows(token) {
  const rows = await readRange(TABS.EXPENSES, '', token)
  if (rows.length <= 1) return []  // header only
  return rows.slice(1)  // return raw arrays without header
}

export async function writeAllExpenseRows(rows, token) {
  await clearAndWrite(TABS.EXPENSES, rows, token)
}

export async function readAllIncomeRows(token) {
  const rows = await readRange(TABS.INCOME, '', token)
  if (rows.length <= 1) return []
  return rows.slice(1)
}

export async function writeAllIncomeRows(rows, token) {
  await clearAndWrite(TABS.INCOME, rows, token)
}

// ─── DEFAULT CATEGORIES ─────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: 'cat_rental',      name: 'RENTAL HOME',                  type: 'expense', color: '#2A9D8F' },
  { id: 'cat_home',        name: 'OWNED HOME',                   type: 'expense', color: '#264653' },
  { id: 'cat_entertain',   name: 'ENTERTAINMENT',                type: 'expense', color: '#E76F51' },
  { id: 'cat_invest',      name: 'INVESTMENTS & SAVINGS',        type: 'savings', color: '#8338EC' },
  { id: 'cat_vacations',   name: 'VACATIONS',                    type: 'expense', color: '#3A86FF' },
  { id: 'cat_electronics', name: 'ELECTRONICS & HOME GOODS',     type: 'expense', color: '#457B9D' },
  { id: 'cat_personal',    name: 'PERSONAL & LIFESTYLE',         type: 'expense', color: '#FB8500' },
  { id: 'cat_health',      name: 'HEALTH',                       type: 'expense', color: '#D62828' },
  { id: 'cat_loans',       name: 'LOANS',                        type: 'expense', color: '#6A4C93' },
  { id: 'cat_return',      name: 'RETURN MONEY',                 type: 'expense', color: '#06D6A0' },
  { id: 'cat_recharge',    name: 'RECHARGE & SUBSCRIPTION',      type: 'expense', color: '#F72585' },
  { id: 'cat_services',    name: 'SERVICES (PLANNING,BUILDING,ETC)', type: 'expense', color: '#7209B7' },
  { id: 'cat_travel',      name: 'TRAVELLING',                   type: 'expense', color: '#4361EE' },
  { id: 'cat_misc',        name: 'MISCELLANEOUS',                type: 'expense', color: '#FF6B6B' },
]

// ─── AUTO-SETUP ─────────────────────────────────────────────
export async function setupSheet(token) {
  if (!_sheetId) throw new Error('No spreadsheet ID set')
  // 1. Get existing sheets
  const getUrl = API_CONFIG.SHEET.getMetaUrl(_sheetId, API_CONFIG.API_KEY)
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } })
  if (!getRes.ok) throw new Error('Failed to read spreadsheet info')
  const meta = await getRes.json()
  const existingTitles = meta.sheets.map(s => s.properties.title)

  const requests = []
  const tabs = [TABS.CATEGORIES, TABS.EXPENSES, TABS.INCOME]
  tabs.forEach(t => {
    if (!existingTitles.includes(t)) {
      requests.push({ addSheet: { properties: { title: t } } })
    }
  })

  // 2. Add missing sheets
  if (requests.length > 0) {
    const updateUrl = API_CONFIG.SHEET.getBatchUpdateUrl(_sheetId, API_CONFIG.API_KEY)
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requests })
    })
    if (!updateRes.ok) throw new Error('Failed to create new sheets')
  }

  // 3. Write headers
  await writeRange(TABS.CATEGORIES, 'A1', [['id', 'name', 'type', 'color', 'budget']], token)
  await writeRange(TABS.EXPENSES, 'A1', [['id', 'year', 'month', 'categoryId', 'itemName', 'amount', 'isFixed', 'note']], token)
  await writeRange(TABS.INCOME, 'A1', [['id', 'year', 'month', 'source', 'amount']], token)

  // 4. Write default categories
  await appendRows(TABS.CATEGORIES, DEFAULT_CATEGORIES.map(c => [c.id, c.name, c.type, c.color]), token)
}
