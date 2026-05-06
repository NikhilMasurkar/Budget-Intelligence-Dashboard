import React, { useMemo, useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt  = n => '₹' + Math.round(+n || 0).toLocaleString('en-IN')
const fmtK = n => { const v = Math.round(+n||0); return v >= 100000 ? '₹'+(v/100000).toFixed(1)+'L' : v >= 1000 ? '₹'+(v/1000).toFixed(1)+'K' : '₹'+v }

const CHART_OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
  scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8891b8', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8891b8', font: { size: 11 }, callback: v => fmtK(v) } } } }

const YEAR_NOW  = new Date().getFullYear()
const MONTH_NOW = new Date().getMonth() // 0-indexed

// Jan → current month for current year; all months for past years
function defaultMonths(year) {
  return year >= YEAR_NOW
    ? [...Array(MONTH_NOW + 1).keys()]   // 0..MONTH_NOW
    : [...Array(12).keys()]              // 0..11
}

export default function Dashboard({ expenses, income, categories, year, month, filterMonth, onMonthChange }) {
  const [selMonths, setSelMonths] = useState(() => defaultMonths(year))
  const [detailModal, setDetailModal] = useState(null)

  // When year changes → reset to smart default for that year
  useEffect(() => {
    setSelMonths(defaultMonths(year))
  }, [year])

  // When filterMonth changes from OUTSIDE (not null) → select just that month
  // filterMonth=null means reset to smart default
  useEffect(() => {
    if (filterMonth !== null && filterMonth >= 1 && filterMonth <= 12) {
      setSelMonths([filterMonth - 1])
    } else if (filterMonth === null) {
      setSelMonths(defaultMonths(year))
    }
  }, [filterMonth])

  // ── INVESTMENT CATEGORY IDs ────────────────────────────────
  // Treat these category names as "investments" (savings outflows, not spending)
  const INVEST_NAMES = useMemo(() =>
    new Set(['INVESTMENTS & SAVINGS', 'FINANCIAL OBLIGATIONS', 'INVESTMENT', 'SAVINGS'].map(n => n.toUpperCase()))
  , [])

  const investCatIds = useMemo(() =>
    new Set(categories.filter(c => INVEST_NAMES.has(c.name.toUpperCase())).map(c => c.id))
  , [categories, INVEST_NAMES])

  // Build monthly aggregates — split expenses into investing vs spending
  const monthlyData = useMemo(() => {
    const inc  = Array(12).fill(0)
    const exp  = Array(12).fill(0)   // ALL expenses incl. investments
    const inv  = Array(12).fill(0)   // INVESTMENT expenses only
    const spend= Array(12).fill(0)   // NON-investment expenses

    income.forEach(i => {
      const m = +i.month - 1
      if (m >= 0 && m < 12) inc[m] += +i.amount || 0
    })
    expenses.forEach(e => {
      const m = +e.month - 1
      if (m < 0 || m >= 12) return
      const amt = +e.amount || 0
      exp[m] += amt
      if (investCatIds.has(e.categoryId)) inv[m] += amt
      else spend[m] += amt
    })
    return {
      inc, exp, inv, spend,
      sav:       inc.map((v, i) => v - exp[i]),       // Net after all expenses
      trueSav:   inc.map((v, i) => v - spend[i]),     // Savings after spending (incl. investments as savings)
      wealthBuilt: inc.map((v, i) => v - spend[i]),   // same as trueSav
    }
  }, [income, expenses, investCatIds])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  // Category totals for selected months
  const catTotals = useMemo(() => {
    const t = {}
    expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
      const cat = catMap[e.categoryId]?.name || e.categoryId || 'Other'
      t[cat] = (t[cat] || 0) + (+e.amount || 0)
    })
    return Object.entries(t).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])
  }, [expenses, catMap, selMonths])

  // Investment breakdown by item for selected months
  const investBreakdown = useMemo(() => {
    const breakdown = {}
    expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
      if (investCatIds.has(e.categoryId)) {
        const name = e.itemName || 'Unnamed'
        breakdown[name] = (breakdown[name] || 0) + (+e.amount || 0)
      }
    })
    return Object.entries(breakdown).filter(([,v]) => v > 0).sort((a,b) => b[1] - a[1])
  }, [expenses, selMonths, investCatIds])

  // Selected period totals
  const selIncome    = selMonths.reduce((s,i) => s + monthlyData.inc[i],   0)
  const selExpense   = selMonths.reduce((s,i) => s + monthlyData.exp[i],   0)
  const selInvest    = selMonths.reduce((s,i) => s + monthlyData.inv[i],   0)
  const selSpend     = selMonths.reduce((s,i) => s + monthlyData.spend[i], 0)
  const selNetSav    = selIncome - selExpense          // after all outflows
  const selTrueSav   = selIncome - selSpend            // income minus pure spending
  const selWealth    = selTrueSav                      // = investments + net savings

  const savRate      = selIncome > 0 ? (selNetSav  / selIncome * 100).toFixed(1) : 0
  const investRate   = selIncome > 0 ? (selInvest  / selIncome * 100).toFixed(1) : 0
  const wealthRate   = selIncome > 0 ? (selWealth  / selIncome * 100).toFixed(1) : 0
  const expRate      = selIncome > 0 ? (selExpense / selIncome * 100).toFixed(1) : 0

  const filteredLabels = selMonths.map(i => MONTHS[i])
  const catColors = ['#5b7fff','#3de8a0','#ff5f5f','#b97fff','#ffb347','#ff6eb4','#60c0ff','#ffd700','#ff8c69','#7fffd4']

  return (
    <div className="fade-in">
      {/* Month Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 4 }}>Filter:</span>
        {MONTHS.map((m, i) => (
          <button key={i} onClick={() => {
            const isSelected = selMonths.includes(i);
            setSelMonths(s => isSelected ? (s.length > 1 ? s.filter(x => x !== i) : s) : [...s, i].sort((a,b)=>a-b));
          }}
            style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: selMonths.includes(i) ? 'var(--accent)' : 'transparent',
              borderColor: selMonths.includes(i) ? 'var(--accent)' : 'var(--border2)',
              color: selMonths.includes(i) ? 'white' : 'var(--text2)' }}>{m}</button>
        ))}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        {[
          { label: 'Q1', months: [0,1,2] },
          { label: 'Q2', months: [3,4,5] },
          { label: 'Q3', months: [6,7,8] },
          { label: 'Q4', months: [9,10,11] },
        ].map(q => {
          // Active when ALL 3 quarter months are selected (regardless of total count)
          const isActive = q.months.every(m => selMonths.includes(m)) && selMonths.length === q.months.length
          return (
            <button key={q.label}
              onClick={() => setSelMonths(q.months)}   // no onMonthChange — avoids filterMonth override
              style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: isActive ? 'var(--accent)' : 'transparent',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                color: isActive ? 'white' : 'var(--text3)' }}>{q.label}</button>
          )
        })}
        <button onClick={() => setSelMonths([...Array(12).keys()])}
          style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
            background: selMonths.length === 12 ? 'var(--accent)' : 'transparent',
            borderColor: selMonths.length === 12 ? 'var(--accent)' : 'var(--border)',
            color: selMonths.length === 12 ? 'white' : 'var(--text3)' }}>All</button>
      </div>

      {/* KPI Row 1 — Core financials */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
        {[
          { label: 'Total Income',    value: fmt(selIncome),  sub: `${selMonths.length} month${selMonths.length>1?'s':''}`, color: '#5b7fff', icon: '💵' },
          { label: 'Total Expenses',  value: fmt(selExpense), sub: `${expRate}% of income`,     color: '#ff5f5f', icon: '💸' },
          { label: 'Net Savings',     value: fmt(selNetSav),  sub: `${savRate}% savings rate`,  color: selNetSav >= 0 ? '#3de8a0' : '#ff5f5f', icon: '🏦' },
          { label: 'Avg Monthly Exp', value: fmt(selExpense/selMonths.length), sub: 'per month', color: '#ffb347', icon: '📊' },
          { label: 'Top Category',    value: catTotals[0]?.[0] || '—', sub: catTotals[0] ? fmt(catTotals[0][1]) : '', color: '#b97fff', icon: '🏷️' },
        ].map((k,i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text3)', marginBottom: 10, fontWeight: 600 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* KPI Row 2 — Wealth / Investment section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {/* Investments card */}
        <div style={{ background: 'linear-gradient(135deg,#1a1f3a,#0f1629)', border: '1px solid rgba(91,127,255,0.3)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#5b7fff,#a78bfa)' }} />
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#8891b8', marginBottom: 8, fontWeight: 700 }}>📈 Investments & Savings</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa', marginBottom: 4 }}>{fmt(selInvest)}</div>
          <div style={{ fontSize: 12, color: '#6c76a8' }}>{investRate}% of income invested</div>
          {selInvest > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#8891b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              <div style={{ marginBottom: investBreakdown.length ? 8 : 0 }}>Avg {fmt(selInvest / selMonths.length)}/month</div>
              {investBreakdown.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {investBreakdown.map(([name, amount]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6c76a8', textTransform: 'lowercase' }}>• {name}</span>
                      <span style={{ color: '#a78bfa', fontWeight: 600 }}>{fmt(amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* True Savings card (income minus pure spending, investments count as savings) */}
        <div style={{ background: 'linear-gradient(135deg,#0d2318,#0a1a10)', border: '1px solid rgba(61,232,160,0.3)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#3de8a0,#22c55e)' }} />
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#8891b8', marginBottom: 8, fontWeight: 700 }}>🏦 Cash Savings</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#3de8a0', marginBottom: 4 }}>{fmt(selNetSav)}</div>
          <div style={{ fontSize: 12, color: '#4a8a6a' }}>{savRate}% of income remaining</div>
          {selNetSav !== 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#8891b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              After all expenses incl. investments
            </div>
          )}
        </div>

        {/* Total Wealth Built = Net Savings + Investments */}
        <div style={{ background: 'linear-gradient(135deg,#1f1a0f,#2a200a)', border: '1px solid rgba(255,179,71,0.35)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ffb347,#ffd700)' }} />
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#8891b8', marginBottom: 8, fontWeight: 700 }}>🚀 Total Wealth Built</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ffd700', marginBottom: 4 }}>{fmt(selWealth)}</div>
          <div style={{ fontSize: 12, color: '#8a7a3a' }}>{wealthRate}% wealth rate</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            <span style={{ color: '#a78bfa' }}>📈 Inv: {fmt(selInvest)}</span>
            <span style={{ color: '#3de8a0' }}>🏦 Cash: {fmt(selNetSav)}</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Income vs Expenses — Mixed Bar + Line chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Income vs Expenses — Monthly Trend</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Compare monthly cash flow throughout the year</div>
          <div style={{ height: 260 }}>
            <Bar
              data={{ labels: filteredLabels, datasets: [
                { type: 'bar',  label: 'Income',      data: selMonths.map(i => monthlyData.inc[i]),  backgroundColor: 'rgba(91,127,255,0.75)',  borderRadius: 4, order: 2 },
                { type: 'bar',  label: 'Expenses',    data: selMonths.map(i => monthlyData.exp[i]),  backgroundColor: 'rgba(255,95,95,0.75)',   borderRadius: 4, order: 2 },
                { type: 'line', label: 'Net Savings', data: selMonths.map(i => monthlyData.sav[i]),
                  borderColor: '#3de8a0', backgroundColor: 'rgba(61,232,160,0.10)',
                  borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#3de8a0',
                  pointBorderColor: '#13151f', pointBorderWidth: 2,
                  tension: 0.35, fill: false, order: 1 },
              ]}}
              options={{
                ...CHART_OPTS,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    align: 'start',
                    labels: { color: '#8891b8', boxWidth: 12, font: { size: 11 }, padding: 16,
                      usePointStyle: true, pointStyle: (ctx) => ctx.datasetIndex === 2 ? 'line' : 'rect' }
                  },
                  tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtK(c.raw)}` } }
                }
              }}
            />
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Category Breakdown</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Share of total spend</div>
          <div style={{ height: 260, position: 'relative' }}>
            <Doughnut data={{ labels: catTotals.map(([k])=>k), datasets: [{ data: catTotals.map(([,v])=>v), backgroundColor: catColors, borderWidth: 2, borderColor: '#13151f' }] }}
              options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { color: '#8891b8', font: { size: 11 }, boxWidth: 10 } }, tooltip: { callbacks: { label: c => `${c.label}: ${fmt(c.raw)}` } } } }} />
          </div>
        </div>
      </div>

      {/* Monthly Expense Breakdown by Category — Stacked Bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Monthly Expense Breakdown by Category</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Stacked view of each category's contribution per month</div>
        <div style={{ height: 300 }}>
          {(() => {
            // Build per-category monthly data for stacked chart
            const catMonthly = {}
            expenses.forEach(e => {
              const m = +e.month - 1
              if (!selMonths.includes(m)) return
              const catName = catMap[e.categoryId]?.name || 'Other'
              const color   = catMap[e.categoryId]?.color || '#6c8fff'
              if (!catMonthly[catName]) catMonthly[catName] = { data: Array(12).fill(0), color }
              catMonthly[catName].data[m] += +e.amount || 0
            })
            const datasets = Object.entries(catMonthly).map(([name, { data, color }]) => ({
              label: name,
              data: selMonths.map(i => data[i]),
              backgroundColor: color + 'cc',
              borderColor: color,
              borderWidth: 0,
              borderRadius: 2,
              stack: 'categories',
            }))
            return (
              <Bar
                data={{ labels: filteredLabels, datasets }}
                options={{
                  ...CHART_OPTS,
                  scales: {
                    ...CHART_OPTS.scales,
                    x: { ...CHART_OPTS.scales.x, stacked: true },
                    y: { ...CHART_OPTS.scales.y, stacked: true },
                  },
                  plugins: {
                    legend: {
                      display: true, position: 'top', align: 'start',
                      labels: { color: '#8891b8', boxWidth: 12, font: { size: 11 }, padding: 14 }
                    },
                    tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtK(c.raw)}` } }
                  }
                }}
              />
            )
          })()}
        </div>
      </div>

      {/* Net Savings + Expense Ratio — 2 column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Net Savings Per Month */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Monthly Net Savings (Cash Short/Extra)</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Positive = surplus, Negative = deficit</div>
          <div style={{ height: 220 }}>
            <Bar data={{ labels: filteredLabels, datasets: [{ label: 'Net Savings',
              data: selMonths.map(i => monthlyData.sav[i]),
              backgroundColor: selMonths.map(i => monthlyData.sav[i] >= 0 ? 'rgba(61,232,160,0.75)' : 'rgba(255,95,95,0.75)'),
              borderRadius: 4 }]}} options={CHART_OPTS} />
          </div>
        </div>

        {/* Expense Ratio to Income */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Expense Ratio to Income</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>% of income spent each month</div>
          <div style={{ height: 220 }}>
            <Line
              data={{ labels: filteredLabels, datasets: [
                {
                  label: 'Expense %',
                  data: selMonths.map(i => monthlyData.inc[i] > 0
                    ? +((monthlyData.exp[i] / monthlyData.inc[i]) * 100).toFixed(1)
                    : 0),
                  borderColor: '#ffb347',
                  backgroundColor: 'rgba(255,179,71,0.12)',
                  borderWidth: 2.5,
                  pointRadius: 4,
                  pointBackgroundColor: '#ffb347',
                  pointBorderColor: '#13151f',
                  pointBorderWidth: 2,
                  tension: 0.35,
                  fill: true,
                },
              ]}}
              options={{
                ...CHART_OPTS,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: c => `Expense ratio: ${c.raw}%` } },
                  annotation: undefined,
                },
                scales: {
                  x: { ...CHART_OPTS.scales.x },
                  y: {
                    ...CHART_OPTS.scales.y,
                    min: 0,
                    ticks: {
                      ...CHART_OPTS.scales.y.ticks,
                      callback: v => `${v}%`,
                    },
                    // Draw a dashed 100% reference line via afterDraw
                  },
                },
              }}
            />
          </div>
          {/* 100% reference label */}
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, textAlign: 'right' }}>
            Dashed line at 100% = spending equals income
          </div>
        </div>

      </div>

      {/* Top Expenses Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Top Expense Items</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>All items for selected period · Click to see details</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Item','Category','Total','Avg/Month','% of Spend'].map(h => (
              <th key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {useMemo(() => {
                const catGroups = {}
                expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
                  const catId = e.categoryId
                  if (!catGroups[catId]) {
                    catGroups[catId] = { 
                      catName: catMap[catId]?.name || catId, 
                      color: catMap[catId]?.color || '#6c8fff', 
                      total: 0, 
                      details: [] 
                    }
                  }
                  catGroups[catId].total += (+e.amount || 0)
                  catGroups[catId].details.push({
                    name: e.itemName || 'Unnamed',
                    month: MONTHS[+e.month - 1],
                    amount: +e.amount || 0
                  })
                })

                return Object.values(catGroups).sort((a,b) => b.total - a.total).slice(0, 12).map((group, i) => {
                  const pct = selExpense > 0 ? (group.total / selExpense * 100).toFixed(1) : 0
                  const sortedDetails = [...group.details].sort((a, b) => b.amount - a.amount)
                  const topItemName = sortedDetails[0].name
                  const moreCount = new Set(sortedDetails.map(d => d.name)).size - 1

                  return (
                    <tr key={i} onClick={() => setDetailModal(group)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{topItemName}</span>
                          {moreCount > 0 && <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--border)', padding: '1px 5px', borderRadius: 10 }}>+{moreCount} more</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}><span style={{ background: group.color+'22', color: group.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{group.catName}</span></td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(group.total)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{fmt(group.total / selMonths.length)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 3, height: 6, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{ width: `${Math.min(+pct * 2, 100)}%`, height: '100%', background: group.color, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }, [expenses, catMap, selMonths, selExpense])}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Details Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModal(null)}>
          <div className="modal" style={{ maxWidth: 850, width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: detailModal.color, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Category Details</div>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{detailModal.catName}</h2>
              </div>
              <button onClick={() => setDetailModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Total Expenditure</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: detailModal.color }}>{fmt(detailModal.total)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Period</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selMonths.length} Months</div>
              </div>
            </div>

            <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              {(() => {
                const uniqueItems = Array.from(new Set(detailModal.details.map(d => d.name))).sort()
                const monthsInPivot = Array.from(new Set(detailModal.details.map(d => d.month))).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
                
                const data = {}
                monthsInPivot.forEach(m => data[m] = {})
                detailModal.details.forEach(d => {
                  data[d.month][d.name] = (data[d.month][d.name] || 0) + d.amount
                })

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface3)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text3)', textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Month</th>
                        {uniqueItems.map(name => (
                          <th key={name} style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text3)', textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{name}</th>
                        ))}
                        <th style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--accent)', textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontWeight: 700 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthsInPivot.map(m => {
                        let monthTotal = 0
                        return (
                          <tr key={m} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px', fontSize: 12, fontWeight: 700, color: 'var(--text2)', background: 'rgba(255,255,255,0.01)', whiteSpace: 'nowrap' }}>{m}</td>
                            {uniqueItems.map(name => {
                              const val = data[m][name] || 0
                              monthTotal += val
                              return (
                                <td key={name} style={{ padding: '10px', textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: val > 0 ? 'white' : 'var(--text3)' }}>
                                  {val > 0 ? fmt(val) : '—'}
                                </td>
                              )
                            })}
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: detailModal.color, fontSize: 13, fontVariantNumeric: 'tabular-nums', background: 'rgba(255,255,255,0.02)' }}>
                              {fmt(monthTotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
