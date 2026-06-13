const BASE = 'https://generativelanguage.googleapis.com/v1beta'

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]

async function getAvailableModels(apiKey) {
  const SESSION_KEY = 'budgetiq_gemini_models'
  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) return JSON.parse(cached)
    const res = await fetch(`${BASE}/models?key=${apiKey}`)
    if (!res.ok) return FALLBACK_MODELS
    const data = await res.json()
    const models = (data.models || [])
      .filter(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        m.name.includes('flash') &&
        !m.name.includes('thinking')
      )
      .map(m => m.name.replace('models/', ''))
      .sort((a, b) => a.length - b.length)
    const list = models.length ? models : FALLBACK_MODELS
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list))
    return list
  } catch {
    return FALLBACK_MODELS
  }
}

async function callModel(modelId, apiKey, prompt) {
  const res = await fetch(`${BASE}/models/${modelId}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status })
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function detectEmployment(income) {
  const sources = income.map(i => (i.source || '').toLowerCase())
  if (sources.some(s => s.includes('salary'))) return 'salaried'
  if (sources.some(s => s.includes('freelance'))) return 'freelancer'
  return 'general'
}

// India new tax regime FY 2025-26 (Budget 2025)
// Standard deduction ₹75,000 for salaried; rebate u/s 87A if taxable ≤ ₹12L
function calcIncomeTax(annualGross) {
  const taxable = Math.max(0, annualGross - 75000)
  if (taxable <= 1200000) return 0  // full rebate u/s 87A
  if (taxable <= 1600000) return (taxable - 1200000) * 0.20
  if (taxable <= 2000000) return 80000  + (taxable - 1600000) * 0.25
  return 180000 + (taxable - 2000000) * 0.30
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function getAIInsights({ expenses, income, categories, selMonths, year, userName }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set in .env')

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const name = userName || 'you'
  const r = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
  const pct = (n, d) => d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%'

  // ── Filter to only months that actually have data ──────────────────────────
  const filteredExp = expenses.filter(e => selMonths.includes(+e.month - 1))
  const filteredInc = income.filter(i => selMonths.includes(+i.month - 1))

  // Count actual months with real data (not just the range selected)
  const monthsWithExp = new Set(filteredExp.map(e => +e.month - 1)).size
  const monthsWithInc = new Set(filteredInc.map(i => +i.month - 1)).size
  const activeMonths  = Math.max(monthsWithExp, monthsWithInc, 1)

  const totalIncome  = filteredInc.reduce((s, i) => s + (+i.amount || 0), 0)
  const totalExpense = filteredExp.reduce((s, e) => s + (+e.amount || 0), 0)
  const netSavings   = totalIncome - totalExpense

  // ── Monthly averages (based on months that actually have data) ─────────────
  const monthlyIncome  = totalIncome  / activeMonths
  const monthlyExpense = totalExpense / activeMonths
  const monthlySavings = netSavings   / activeMonths

  const savingsPct  = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : '0'
  const employmentType = detectEmployment(income)

  // ── Per-category totals AND monthly averages ───────────────────────────────
  const catTotals = {}
  filteredExp.forEach(e => {
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
  const totalSavingsInvested = (catTotals['Investments & Savings'] || 0) +
    Object.entries(catTotals)
      .filter(([k]) => k.toLowerCase().includes('saving') || k.toLowerCase().includes('invest') || k.toLowerCase().includes('return'))
      .reduce((s, [, v]) => s + v, 0)

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
  Monthly spending avg: ${r(monthlyExpense)}/mo
  Monthly net:          ${r(monthlySavings)}/mo  ${monthlySavings < 0 ? '← DEFICIT (spending more than earning)' : `(${savingsPct}% saved)`}

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

  const models = await getAvailableModels(apiKey)
  let lastError = null

  for (const modelId of models) {
    try {
      const text = await callModel(modelId, apiKey, prompt)
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const result = JSON.parse(clean)
      result._model = modelId
      result._employment = employmentType
      return result
    } catch (e) {
      lastError = e
      if (e.status && e.status !== 503 && e.status !== 429) throw e
      continue
    }
  }

  throw lastError || new Error('All models unavailable. Try again later.')
}
