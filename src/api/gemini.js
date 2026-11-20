// All Gemini calls go through our Netlify Edge Function so the API key stays
// server-side (never bundled) and responses stream from the edge. Override with
// VITE_GEMINI_PROXY if hosted elsewhere.
import { auth } from '../firebase'
import { splitSpendInvest } from '../utils/money'
import { detectEmployment, calcIncomeTax } from '../utils/financeMath'

// Pure maths lives in utils/financeMath; re-exported for existing importers.
export { calcIncomeTax, calcInstantScore, buildFinancialContext } from '../utils/financeMath'

// Attach a Firebase ID token so the edge function can gate on it.
// Falls back to an empty object if the user isn't signed in yet (shouldn't
// happen in practice — Gemini features are only shown post-auth).
async function authHeaders() {
  try {
    const token = await auth.currentUser?.getIdToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
const PROXY = (() => {
  let p = import.meta.env.VITE_GEMINI_PROXY || '/api/gemini'
  if (p && !p.startsWith('/') && !p.startsWith('http')) {
    p = '/' + p
  }
  return p
})()

// Lives in constants so App can read it without pulling this module into the main chunk.
export { AI_ENABLED } from '../utils/constants'

function proxyUrl(path, { sse = false } = {}) {
  const qs = new URLSearchParams({ path })
  if (sse) qs.set('alt', 'sse')
  return `${PROXY}?${qs.toString()}`
}

const FALLBACK_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
]

// Persisted preferred model — survives page refreshes.
const _PREF_KEY = 'budgetiq_gemini_model'
let _workingModel = (() => { try { return localStorage.getItem(_PREF_KEY) } catch { return null } })()

function _saveModel(id) {
  _workingModel = id
  try { localStorage.setItem(_PREF_KEY, id) } catch {}
}

// gemini-2.5+ and gemini-3.x are thinking models — disable thinking to avoid
// burning the token budget on thoughts and leaving no room for the actual response.
function isThinkingModel(modelId) {
  return /gemini-2\.5|gemini-3\.[0-9]/.test(modelId)
}

async function getAvailableModels() {
  const SESSION_KEY = 'budgetiq_gemini_models_v2'
  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) return JSON.parse(cached)
    const res = await fetch(proxyUrl('models'), { headers: await authHeaders() })
    if (!res.ok) return FALLBACK_MODELS
    const data = await res.json()
    const models = (data.models || [])
      .filter(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        m.name.includes('flash') &&
        !m.name.includes('thinking')
      )
      .map(m => m.name.replace('models/', ''))
      .sort((a, b) => {
        // non-thinking models first (faster, no budget concerns), then thinking
        const aThink = isThinkingModel(a) ? 1 : 0
        const bThink = isThinkingModel(b) ? 1 : 0
        return aThink - bThink || a.length - b.length
      })
    const list = models.length ? models : FALLBACK_MODELS
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list))
    return list
  } catch {
    return FALLBACK_MODELS
  }
}

async function callModel(modelId, prompt) {
  const thinking = isThinkingModel(modelId)
  const res = await fetch(proxyUrl(`models/${modelId}:generateContent`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        ...(thinking && { thinkingConfig: { thinkingBudget: 0 } })
      }
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status })
  }
  const data = await res.json()
  // If model ran out of tokens the JSON will be truncated — skip to the next model
  if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
    throw new Error(`${modelId} hit MAX_TOKENS — trying next model`)
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function getAIInsights({ expenses, income, categories, selMonths, year, userName }) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const name = userName || 'you'
  const r = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

  // ── Filter to only months that actually have data ──────────────────────────
  const filteredExp = expenses.filter(e => selMonths.includes(+e.month - 1))
  const filteredInc = income.filter(i => selMonths.includes(+i.month - 1))

  // Count actual months with real data (not just the range selected)
  const monthsWithExp = new Set(filteredExp.map(e => +e.month - 1)).size
  const monthsWithInc = new Set(filteredInc.map(i => +i.month - 1)).size
  const activeMonths  = Math.max(monthsWithExp, monthsWithInc, 1)

  const totalIncome  = filteredInc.reduce((s, i) => s + (+i.amount || 0), 0)
  const { spend: totalExpense, invest: totalInvested, investIds } = splitSpendInvest(filteredExp, categories)
  const netSavings   = totalIncome - totalExpense

  // ── Monthly averages (based on months that actually have data) ─────────────
  const monthlyIncome  = totalIncome  / activeMonths
  const monthlyExpense = totalExpense / activeMonths
  const monthlySavings = netSavings   / activeMonths

  const savingsPct  = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : '0'
  const employmentType = detectEmployment(income)

  // ── Per-category totals AND monthly averages ───────────────────────────────
  // Investment categories are skipped: this table is labelled as spending and
  // its shares are compared against the spending total above, which already
  // excludes them. Leaving them in made the categories sum past that total.
  const catTotals = {}
  filteredExp.forEach(e => {
    if (investIds.has(e.categoryId)) return
    const cat = catMap[e.categoryId] || 'Other'
    catTotals[cat] = (catTotals[cat] || 0) + (+e.amount || 0)
  })
  // Build table: Category | Total | Monthly avg | % of monthly income
  const catRows = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => {
      const monthly = total / activeMonths
      const share   = monthlyIncome > 0 ? (monthly / monthlyIncome * 100).toFixed(1) : '0'
      return `  ${cat.padEnd(32)} ${r(total).padStart(12)} total  |  ${r(monthly).padStart(10)}/mo  |  ${share}% of income`
    })

  // ── Income source breakdown (monthly averages) ─────────────────────────────
  const sourceMap = {}
  filteredInc.forEach(i => {
    const src = i.source || 'Other'
    sourceMap[src] = (sourceMap[src] || 0) + (+i.amount || 0)
  })
  const incomeRows = Object.entries(sourceMap)
    .map(([src, total]) => {
      const monthly = total / activeMonths
      return `  ${src.padEnd(20)} ${r(total).padStart(12)} total  |  ${r(monthly).padStart(10)}/mo`
    })

  // ── Income tax — calculate in JS, NOT by AI ────────────────────────────────
  const salaryTotal   = sourceMap['Salary'] || 0
  const salaryMonthly = salaryTotal / activeMonths
  const annualSalary  = salaryMonthly * 12

  // HARD guard: only include tax advice if annual salary is genuinely > ₹12L
  const needsTaxAdvice = employmentType === 'salaried' && annualSalary > 1200000
  const estimatedTax   = needsTaxAdvice ? calcIncomeTax(annualSalary) : 0

  // ── Healthy benchmarks pre-computed for this income level ─────────────────
  const benchHousing  = monthlyIncome * 0.30
  const benchLoans    = monthlyIncome * 0.40
  const benchSavings  = monthlyIncome * 0.20
  const benchEmergFund = monthlyExpense * 6
  // Already summed by splitSpendInvest off the explicit type='savings' flag —
  // the same definition the Dashboard and the PDF export uses. This used
  // to re-derive it by name-matching catTotals, which now excludes investment
  // categories entirely and would have made this silently zero.
  const totalSavingsInvested = totalInvested

  const monthsLabel = `${activeMonths} month${activeMonths > 1 ? 's' : ''} with data`
  const periodMonths = [...new Set(filteredExp.map(e => +e.month - 1))]
    .sort().map(m => monthNames[m]).join(', ')

  const taxSection = needsTaxAdvice ? `

━━━ INCOME TAX (annual salary ${r(annualSalary)} > ₹12 lakh) ━━━
  Estimated annual tax (new regime): ~${r(estimatedTax)}
  Monthly tax ~${r(estimatedTax / 12)}
  Can invest ₹1,50,000/year in 80C (PPF/ELSS/NPS) + ₹50,000 in NPS 80CCD(1B) to reduce tax
  Include one insight about this.` : `

NOTE: Annual salary = ${r(annualSalary)}/year (below ₹12 lakh).
DO NOT give any income tax advice. The user does not need to worry about income tax.`

  const prompt = `You are a personal finance advisor helping ${name}, a ${employmentType === 'salaried' ? 'salaried employee' : 'person'} in India.

CRITICAL RULES YOU MUST FOLLOW:
1. ALWAYS compare same-period numbers. If comparing rent to income, use MONTHLY rent vs MONTHLY income. Never compare a total to a monthly figure.
2. Every number you mention must come directly from the data below — do not make up or estimate numbers.
3. Simple English only. No jargon. Address ${name} by name.
4. Focus on: where money is leaking, overspending categories, saving gap, emergency fund, and what to do first.
5. Sort insights by priority — most urgent problem first.

━━━ PERIOD ━━━
Months analysed: ${periodMonths} ${year} (${monthsLabel})
All averages below are based on ${activeMonths} months of real data.

━━━ MONTHLY INCOME vs SPENDING (compare these to each other) ━━━
  Monthly income avg:   ${r(monthlyIncome)}/mo
  Monthly spending avg: ${r(monthlyExpense)}/mo   ← real spending; money moved into investments is NOT counted here
  Monthly invested avg: ${r(totalInvested / activeMonths)}/mo   ← a transfer into their own investments, not spending
  Monthly net:          ${r(monthlySavings)}/mo  ${monthlySavings < 0 ? '← DEFICIT (spending more than earning)' : `(${savingsPct}% saved, of which ${r(totalInvested / activeMonths)}/mo goes to investments)`}

━━━ INCOME SOURCES (monthly averages) ━━━
${incomeRows.join('\n')}

━━━ ALL SPENDING CATEGORIES ━━━
(Format: Category | Total for period | Monthly average | % of monthly income)
${catRows.join('\n')}

━━━ HEALTHY BENCHMARKS FOR ${r(monthlyIncome)}/mo INCOME ━━━
  Max housing/rent:  ${r(benchHousing)}/mo  (30% of income)
  Max loans/EMIs:    ${r(benchLoans)}/mo   (40% of income)
  Min savings:       ${r(benchSavings)}/mo  (20% of income)
  Emergency fund:    ${r(benchEmergFund)}   (6 months of monthly expenses ${r(monthlyExpense)})
  Total saved/invested in period: ${r(totalSavingsInvested)} (${r(totalSavingsInvested / activeMonths)}/mo)
${taxSection}

━━━ WHAT TO ANALYSE ━━━
Look at MONTHLY averages vs benchmarks above. Find:
1. Which categories are OVER the healthy % of monthly income? By how much per month?
2. Is the person saving enough? Are they in deficit?
3. Emergency fund — how much built vs target?
4. Where exactly can ${name} cut spending?
5. What should ${name} do first, second, third?

━━━ OUTPUT FORMAT ━━━
Return ONLY valid JSON — no markdown fences, no text outside.
IMPORTANT: In "numbers" always use monthly figures (not totals), OR label them clearly as "total" if using totals.
color must be exactly: "red", "green", "amber", or "neutral"

{
  "employment_type": "${employmentType}",
  "summary": "One plain sentence for ${name} about their situation using monthly numbers",
  "score": <integer 1-10>,
  "insights": [
    {
      "type": "alert|warning|tip|positive",
      "priority": "high|medium|low",
      "title": "Short plain title 4-6 words",
      "numbers": [
        { "label": "Monthly income", "value": "${r(monthlyIncome)}/mo", "color": "neutral" },
        { "label": "This category/month", "value": "₹X,XXX/mo", "color": "red" },
        { "label": "Should be max", "value": "₹X,XXX/mo", "color": "amber" }
      ],
      "action": "Tell ${name} exactly what to do. Use monthly ₹ numbers only. 2 sentences."
    }
  ]
}`

  const models = await getAvailableModels()
  // Put the last working model at the front to skip the search next time
  const ordered = _workingModel
    ? [_workingModel, ...models.filter(m => m !== _workingModel)]
    : models
  let lastError = null

  for (const modelId of ordered) {
    try {
      const text = await callModel(modelId, prompt)
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const result = JSON.parse(clean)
      _saveModel(modelId)
      result._model = modelId
      result._employment = employmentType
      return result
    } catch (e) {
      lastError = e
      // 429 rate-limit, 503 unavailable, 404 model-not-found, 400 model-specific
      // config rejection → all recoverable, try next model.
      // Anything else (401 bad key, 403 forbidden) is unrecoverable — stop.
      if (e.status && ![400, 404, 429, 503].includes(e.status)) throw e
      continue
    }
  }

  throw lastError || new Error('All models unavailable. Try again later.')
}

// ── Streaming chat ────────────────────────────────────────────────────────────
export async function getChatResponseStream({ messages, financialContext, onChunk }) {
  const models  = await getAvailableModels()
  const ordered = _workingModel
    ? [_workingModel, ...models.filter(m => m !== _workingModel)]
    : models

  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }))

  for (const modelId of ordered) {
    try {
      const res = await fetch(
        proxyUrl(`models/${modelId}:streamGenerateContent`, { sse: true }),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...await authHeaders() },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: financialContext }] },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
              ...(isThinkingModel(modelId) && { thinkingConfig: { thinkingBudget: 0 } })
            }
          })
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw Object.assign(new Error(err?.error?.message || `HTTP ${res.status}`), { status: res.status })
      }

      if (!res.body) throw new Error(`${modelId} returned no response body`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''
      let fullText  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json || json === '[DONE]') continue
          try {
            const data  = JSON.parse(json)
            const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (chunk) { fullText += chunk; onChunk(fullText) }
          } catch {}
        }
      }

      if (!fullText) throw new Error(`${modelId} streamed empty response — trying next`)
      _saveModel(modelId)
      return fullText
    } catch (e) {
      if (e.status && ![400, 404, 429, 503].includes(e.status)) throw e
      continue
    }
  }

  throw new Error('All models unavailable. Try again later.')
}
