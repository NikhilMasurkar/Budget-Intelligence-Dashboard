<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---
name: Budget-app
description: >
  Use this skill whenever the user wants to create, regenerate, beautify, update, or add data to
  their Personal Monthly Budget Excel file. Triggers include: "create my budget sheet",
  "add a new month", "add new category", "update my expenses", "make a new year sheet",
  "beautify my excel", "generate budget for 2027", or any reference to balance_sheet_.xlsx.
  This skill encodes the EXACT layout, styling, categories, formulas, and colour scheme of
  Nik's personal budget workbook so Claude can reproduce or extend it perfectly every time.
license: Personal use
---

# Personal Budget Excel — Complete Skill Guide

This skill teaches Claude the EXACT structure, visual style, formulas, and data conventions
of Nik's personal monthly budget workbook so it can create, extend, or beautify the file
with zero guesswork.

---

## 1. WORKBOOK OVERVIEW

| Property | Value |
|---|---|
| File name | `balance_sheet_.xlsx` |
| One sheet per year | `PERSONALBUDGET2025`, `PERSONALBUDGET2026`, `PERSONALBUDGET2027` … |
| Summary sheet | `Sheet2` — year-level totals (Income / Expenses / Savings) |
| Language | English labels, Indian Rupee (₹) values |
| Number format | Indian comma system: `₹1,00,000` |

---

## 2. EXACT SHEET LAYOUT (row by row)

```
Row 1  : [empty]
Row 2  : Merged title — "MONTHLY BUDGET {YEAR}"  (spans A2:P2)
Row 3  : [empty]
Row 4  : col B = "REVENUE"  (label, no data)
Row 5  : INCOME section header  →  col A="INCOME", cols C–N = JAN–DEC, col P = YEAR
Row 6  : Wages                  →  monthly values, col P = SUM formula
Row 7  : Interest/dividends     →  monthly values, col P = SUM formula
Row 8  : Miscellaneous          →  monthly values, col P = SUM formula
Row 9  : Total (income)         →  SUM formula row, bold
Row 10 : [empty]
Row 11 : EXPENSES section header  →  col A="EXPENSES"
         ── then each CATEGORY block ──
         [category header row]  →  col A=CAT NAME, cols C–N = JAN–DEC, col P = YEAR
         [item rows]            →  col A=item name, cols C–N = values or 0
         [Total row]            →  SUM formula, bold
         [empty row]
         ... repeat for all categories ...
[Last section]
         TOTALS header row      →  col A="TOTALS", cols C–N = JAN–DEC, col P = YEAR
         Total expenses row     →  =SUM of all category totals
         Cash short/extra row   →  =Income Total − Expense Total  (positive=surplus, negative=deficit)
[Notes rows below]              →  informal Marathi/Hindi notes about who owes what
```

**Column mapping (0-indexed python → Excel letter):**
| Python col | Excel col | Content |
|---|---|---|
| 0 / A | A | Row label / item name |
| 1 / B | B | Merged / section label (usually blank) |
| 2 / C | C | JAN |
| 3 / D | D | FEB |
| 4 / E | E | MAR |
| 5 / F | F | APR |
| 6 / G | G | MAY |
| 7 / H | H | JUN |
| 8 / I | I | JUL |
| 9 / J | J | AUG |
| 10 / K | K | SEP |
| 11 / L | L | OCT |
| 12 / M | M | NOV |
| 13 / N | N | DEC |
| 14 / O | O | (blank spacer) |
| 15 / P | P | YEAR total |

---

## 3. CATEGORIES (in order, with their standard line items)

### 🏠 HOME
| Item | Fixed? | Notes |
|---|---|---|
| LOAN EMI (Marriage) | ✅ Fixed | ₹15,500/month; started Mar 2025 |
| ELECTRIC BILL | Variable | Spikes in summer (May–Sep) |
| EMI | Variable | Other loans; may be 0 |
| Utilities | Variable | Usually 0 |

### 🏠 RENTAL HOME
| Item | Fixed? | Notes |
|---|---|---|
| Rent | ✅ Fixed | ₹9,000–9,500/month |
| Electric Bill | Variable | ₹300–800 typically |
| kirana | Variable | Grocery/general store; ₹2,000–3,500 |
| metro | Variable | Daily commute; ₹700–1,700 |
| drinking water bill | ✅ Fixed | ₹180–350 |
| water bill / used water bill | ✅ Fixed | ₹250 |
| gas | Variable | Quarterly purchase ~₹1,300 |

### 🎬 ENTERTAINMENTS
| Item | Fixed? | Notes |
|---|---|---|
| RECHARGE | Variable | Mobile/OTT recharge |
| MOVIE | Variable | Usually 0 |

### 💰 FINANCIAL OBLIGATIONS
| Item | Fixed? | Notes |
|---|---|---|
| SIP 2nd & 5th date | ✅ Fixed | ₹4,000–5,000/month mutual fund |
| GOLD 6th | Variable | ₹2,000–2,100 (Apr–Dec mostly) |
| Rd + Pihu / pihu Savings | Variable | Recurring deposit / child savings |
| Bc+backtgath | Variable | Chit fund / group savings scheme |

### ✈️ VACATIONS
| Item | Notes |
|---|---|
| Plane fare | Occasional |
| Accommodations | Usually 0 |
| Food | Usually 0 |
| Souvenirs | Usually 0 |
| Pet boarding | Usually 0 |
| Rental car | Usually 0 |

### 🎮 RECREATION (2025 only — merged into VACATIONS in 2026)
| Item | Notes |
|---|---|
| movie Tickets | Occasional |
| Sports equipment | Usually 0 |
| Team dues | Usually 0 |
| Toys/child gear | Usually 0 |

### 👤 PERSONAL
| Item | Notes |
|---|---|
| Clothing | Can spike heavily (₹13,744 seen in single month) |
| Gifts | Occasional |
| Salon/barber / Salon/barber/blows | Occasional |
| Tickets | Events; can be large |
| outside Food | Restaurants/delivery |

### 🔧 MISC PAYMENTS
| Item | Notes |
|---|---|
| Need to pay | Informal loans given to others (Shubham, Aky, Yogita) |
| Hospital + Health insurance | Medical + insurance premiums |
| Travelling exp | Travel costs |
| vegetables | Daily vegetable purchases |
| other / Other | Catch-all miscellaneous |

### 🔌 UTENSILS / ELECTRONICS (2026+ only)
| Item | Notes |
|---|---|
| Electronic | Large purchases (₹15,974 seen) |
| gadgets | Usually 0 |
| Team dues | Usually 0 |
| Toys/child gear | Usually 0 |

---

## 4. BEAUTIFIED COLOUR SCHEME (apply with openpyxl)

```
DESIGN LANGUAGE: Clean dark-accent professional budget tracker
Primary palette: Deep navy header + white body + colour-coded categories
```

| Element | Fill colour (hex) | Font colour | Font |
|---|---|---|---|
| Title row ("MONTHLY BUDGET YYYY") | `1E3A5F` (deep navy) | `FFFFFF` | Arial 16 Bold |
| INCOME section header | `2D6A4F` (forest green) | `FFFFFF` | Arial 11 Bold |
| Income item rows | `D8F3DC` (light mint) | `1B4332` | Arial 10 |
| Income Total row | `52B788` (medium green) | `FFFFFF` | Arial 10 Bold |
| EXPENSES section header | `6D2B2B` (dark red) | `FFFFFF` | Arial 11 Bold |
| Category header rows | See per-category table below | `FFFFFF` | Arial 10 Bold |
| Category item rows | Alternating `F8F9FA` / `FFFFFF` | `212529` | Arial 10 |
| Category Total rows | `E9ECEF` | `212529` | Arial 10 Bold Italic |
| TOTALS section header | `1E3A5F` | `FFFFFF` | Arial 11 Bold |
| Total Expenses row | `C1121F` (bold red) | `FFFFFF` | Arial 10 Bold |
| Cash short/extra row | Conditional: green if ≥0, red if <0 | `FFFFFF` | Arial 10 Bold |
| Month header row (JAN–DEC + YEAR) | `2B2D42` (charcoal) | `EDF2F4` | Arial 9 Bold |
| Empty/spacer rows | `FFFFFF` | — | — |
| Notes rows (below TOTALS) | `FFF3CD` (light yellow) | `856404` | Arial 9 Italic |

**Per-category header colours:**
| Category | Fill | Font |
|---|---|---|
| HOME | `264653` (dark teal) | `FFFFFF` |
| RENTAL HOME | `2A9D8F` (teal) | `FFFFFF` |
| ENTERTAINMENTS | `E76F51` (terracotta) | `FFFFFF` |
| FINANCIAL OBLIGATIONS | `8338EC` (purple) | `FFFFFF` |
| VACATIONS | `3A86FF` (bright blue) | `FFFFFF` |
| RECREATION | `06D6A0` (emerald) | `FFFFFF` |
| PERSONAL | `FB8500` (amber) | `FFFFFF` |
| MISC PAYMENTS | `D62828` (crimson) | `FFFFFF` |
| UTENSILS / ELECTRONICS | `457B9D` (steel blue) | `FFFFFF` |

**Column widths:**
| Column | Width |
|---|---|
| A (label) | 28 |
| B (spacer) | 4 |
| C–N (months) | 10 each |
| O (spacer) | 3 |
| P (YEAR) | 13 |

**Row heights:**
- Title row: 32
- Section headers: 22
- Category headers: 20
- Item rows: 18
- Total rows: 20

**Additional styling:**
- All currency cells: `₹#,##0;(₹#,##0);"-"` format (dashes for zeros)
- Month headers: center-aligned, bold
- Label column (A): left-aligned
- Values: right-aligned
- Title: merged across A:P, center-aligned horizontally and vertically
- Thin borders on all data cells; medium border below each Total row
- Freeze panes at C6 (freeze label column + month headers)

---

## 5. EXCEL FORMULAS TO USE (never hardcode calculated values)

```python
# Income Total row (row 9, assume months in C9:N9)
sheet[f'C9'] = '=SUM(C6:C8)'   # per month
sheet[f'P9'] = '=SUM(P6:P8)'   # year total (or =SUM(C9:N9))

# Category Total row (example for HOME, assume items in rows 12–15)
sheet[f'C16'] = '=SUM(C12:C15)'
sheet[f'P16'] = '=SUM(C16:N16)'  # year = sum of months

# Every item's YEAR column
sheet[f'P{row}'] = f'=SUM(C{row}:N{row})'

# TOTALS section — Total expenses (sum all category total rows)
sheet[f'C{totals_row}'] = '=C16+C26+C31+C38+C47+C54+C63+C74'  # adjust row nums

# Cash short/extra
sheet[f'C{cash_row}'] = f'=C9-C{totals_row}'

# Conditional formatting for Cash short/extra: green if >=0, red if <0
from openpyxl.formatting.rule import ColorScaleRule, CellIsRule
from openpyxl.styles import PatternFill
green_fill = PatternFill(start_color='52B788', end_color='52B788', fill_type='solid')
red_fill   = PatternFill(start_color='C1121F', end_color='C1121F', fill_type='solid')
sheet.conditional_formatting.add(
    f'C{cash_row}:N{cash_row}',
    CellIsRule(operator='greaterThanOrEqual', formula=['0'], fill=green_fill)
)
sheet.conditional_formatting.add(
    f'C{cash_row}:N{cash_row}',
    CellIsRule(operator='lessThan', formula=['0'], fill=red_fill)
)
```

---

## 6. NOTES SECTION (below TOTALS)

The rows below Cash short/extra contain **informal tracker notes** in Marathi/Hindi about
pending informal loans. These should be preserved exactly as written. Style them with:
- Yellow background `FFF3CD`
- Italic font, size 9
- No borders

Example notes found in the file:
```
Shubham Pasun - 17k gyachae ahe
Aky 10800 pending +1700 rs ...
Yogita la 25000 dyache ahe
```

---

## 7. SHEET2 — SUMMARY TAB

| Column A | Column B | Column C | Column D |
|---|---|---|---|
| Year | Total (Income) | Expenses | Savings |
| MONTHLY BUDGET 2025 | 696150 | 603703 | 92447 |
| MONTHLY BUDGET 2026 | 806823 | 710172 | 96651 |

Style: simple table, header row in `1E3A5F` with white text, alternating row fills.
Savings column: green if positive, red if negative (conditional formatting).

---

## 8. ADDING A NEW YEAR SHEET

When the user says "add 2027" or "create new year":

1. Copy the **same category structure** from the previous year
2. Pre-fill with 0 for all months (user will fill in actual values)
3. Keep all fixed expenses pre-filled:
   - Rent (carry forward last known value)
   - LOAN EMI (carry forward)
   - Drinking water bill
   - SIP (carry forward)
4. Leave variable items as 0
5. All formulas intact — do not hardcode

---

## 9. ADDING A NEW CATEGORY

When the user says "add category X":

1. Insert a new category block **before** MISC PAYMENTS (last category)
2. Follow the same block structure: header row → item rows → Total row → empty row
3. Update the TOTALS formula to include the new Total row
4. Choose an appropriate colour from the palette or pick a complementary hex
5. Add it to Sheet2's summary if it affects year totals

---

## 10. ADDING A NEW EXPENSE ITEM TO EXISTING CATEGORY

When the user says "add [item] to [category]":

1. Insert a new row **before** the Total row of that category
2. Set all month values to 0 initially (user fills)
3. Add YEAR formula `=SUM(C{row}:N{row})` in column P
4. The Total row formula auto-expands if using SUM range — verify it includes the new row
5. Style: alternating white/light-grey with the category's item style

---

## 11. ADDING A MONTH'S ACTUAL DATA

When the user says "I spent X on Y in March":

1. Find the item row
2. Update the correct month column (C=JAN, D=FEB, E=MAR … N=DEC)
3. All SUM formulas recalculate automatically
4. Run `scripts/recalc.py` to update calculated values

---

## 12. COMMON INSTRUCTIONS → WHAT TO DO

| User says | Action |
|---|---|
| "create my budget sheet for 2027" | New sheet with all categories, 0 values, fixed items pre-filled |
| "beautify my excel" | Apply full colour scheme from Section 4 to all existing sheets |
| "add groceries category" | New block before MISC PAYMENTS with user-specified items |
| "I paid ₹3,500 rent in May 2026" | Update E{rent_row} in PERSONALBUDGET2026 sheet |
| "add new expense: gym membership under PERSONAL" | New row in PERSONAL block, 0 values |
| "copy fixed expenses to next month" | Copy rows where values have been consistent for 3+ months |
| "fix the totals" | Check all SUM ranges include all item rows, recalc |
| "add notes about Shubham owes me 5k" | Add to notes section in yellow italic |
| "show me where I spent most" | Read Sheet2 + run analysis across category Total rows |

---

## 13. PYTHON GENERATION TEMPLATE

```python
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

# ── COLOUR CONSTANTS ─────────────────────────────────────────
NAVY        = '1E3A5F'
CHARCOAL    = '2B2D42'
INC_HEADER  = '2D6A4F'
INC_ITEM    = 'D8F3DC'
INC_TOTAL   = '52B788'
EXP_HEADER  = '6D2B2B'
WHITE       = 'FFFFFF'
LIGHT_GREY  = 'F8F9FA'
MID_GREY    = 'E9ECEF'
TOTAL_RED   = 'C1121F'
NOTE_BG     = 'FFF3CD'
NOTE_FG     = '856404'

CAT_COLORS = {
    'HOME':                   '264653',
    'RENTAL HOME':            '2A9D8F',
    'ENTERTAINMENTS':         'E76F51',
    'FINANCIAL OBLIGATIONS':  '8338EC',
    'VACATIONS':              '3A86FF',
    'RECREATION':             '06D6A0',
    'PERSONAL':               'FB8500',
    'MISC PAYMENTS':          'D62828',
    'UTENSILS':               '457B9D',
}

# ── HELPER STYLES ────────────────────────────────────────────
def fill(hex_color):
    return PatternFill('solid', start_color=hex_color, end_color=hex_color)

def font(color='000000', size=10, bold=False, italic=False):
    return Font(name='Arial', size=size, bold=bold, italic=italic, color=color)

def center():
    return Alignment(horizontal='center', vertical='center', wrap_text=False)

def right():
    return Alignment(horizontal='right', vertical='center')

def left():
    return Alignment(horizontal='left', vertical='center')

thin = Side(style='thin', color='CCCCCC')
medium = Side(style='medium', color='888888')

def thin_border():
    return Border(left=thin, right=thin, top=thin, bottom=thin)

def bottom_medium():
    return Border(left=thin, right=thin, top=thin, bottom=medium)

MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
CURRENCY_FMT = '₹#,##0;(₹#,##0);"-"'

def set_currency(cell):
    cell.number_format = CURRENCY_FMT
    cell.alignment = right()

def apply_title_row(sheet, year):
    sheet.merge_cells('A2:P2')
    cell = sheet['A2']
    cell.value = f'MONTHLY BUDGET {year}'
    cell.font = font(WHITE, 16, bold=True)
    cell.fill = fill(NAVY)
    cell.alignment = Alignment(horizontal='center', vertical='center')
    sheet.row_dimensions[2].height = 32

def apply_month_header_row(sheet, row_num):
    sheet[f'A{row_num}'].value = 'INCOME'  # or category name — caller sets
    cols = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    for i, m in enumerate(cols):
        col = get_column_letter(i + 3)  # C=3
        c = sheet[f'{col}{row_num}']
        c.value = m
        c.font = font(WHITE, 9, bold=True)
        c.fill = fill(CHARCOAL)
        c.alignment = center()
    sheet[f'P{row_num}'].value = 'YEAR'
    sheet[f'P{row_num}'].font = font(WHITE, 9, bold=True)
    sheet[f'P{row_num}'].fill = fill(CHARCOAL)
    sheet[f'P{row_num}'].alignment = center()

def write_item_row(sheet, row_num, label, monthly_values, is_total=False, is_header=False,
                   header_color=None, bg_color=None):
    """Write a single data row with label in col A and values in C–N."""
    a = sheet[f'A{row_num}']
    a.value = label
    a.alignment = left()
    if is_header:
        a.font = font(WHITE, 10, bold=True)
        a.fill = fill(header_color or '333333')
    elif is_total:
        a.font = font('212529', 10, bold=True, italic=True)
        a.fill = fill(MID_GREY)
    else:
        a.font = font('212529', 10)
        a.fill = fill(bg_color or WHITE)
    a.border = thin_border()

    for i, val in enumerate(monthly_values):  # 12 values
        col = get_column_letter(i + 3)
        c = sheet[f'{col}{row_num}']
        c.value = val  # pass formula string like '=SUM(C12:C15)' or a number
        set_currency(c)
        if is_header:
            c.font = font(WHITE, 10, bold=True)
            c.fill = fill(header_color or '333333')
        elif is_total:
            c.font = font('212529', 10, bold=True, italic=True)
            c.fill = fill(MID_GREY)
            c.border = bottom_medium()
        else:
            c.font = font('212529', 10)
            c.fill = fill(bg_color or WHITE)
            c.border = thin_border()

    # YEAR column
    year_cell = sheet[f'P{row_num}']
    year_cell.value = f'=SUM(C{row_num}:N{row_num})'
    set_currency(year_cell)
    year_cell.font = font('212529', 10, bold=is_total)
    year_cell.fill = fill(MID_GREY if is_total else (bg_color or WHITE))
    year_cell.border = thin_border()

    sheet.row_dimensions[row_num].height = 20 if is_total or is_header else 18

def set_column_widths(sheet):
    sheet.column_dimensions['A'].width = 28
    sheet.column_dimensions['B'].width = 4
    for i in range(12):
        sheet.column_dimensions[get_column_letter(i+3)].width = 10
    sheet.column_dimensions['O'].width = 3
    sheet.column_dimensions['P'].width = 13

def add_cash_conditional(sheet, cash_row):
    """Green background when surplus, red when deficit."""
    g_fill = PatternFill(start_color='52B788', end_color='52B788', fill_type='solid')
    r_fill = PatternFill(start_color='C1121F', end_color='C1121F', fill_type='solid')
    rng = f'C{cash_row}:P{cash_row}'
    sheet.conditional_formatting.add(rng, CellIsRule('greaterThanOrEqual', ['0'], fill=g_fill))
    sheet.conditional_formatting.add(rng, CellIsRule('lessThan', ['0'], fill=r_fill))
```

---

## 14. DATA CONVENTIONS & KNOWN QUIRKS

- **Zero values**: enter as `0`, formatted to display as `-` via number format
- **Missing months**: if a year sheet only has Jan–Apr data, fill remaining months with `0`
- **Marathi notes**: preserve them exactly — they track informal debts
- **"Need to pay"** under MISC PAYMENTS = money given to others (outflow); track separately
- **Pihu savings**: child's savings account — treat as investment outflow
- **Bc+backtgath**: chit fund contribution — treat as savings/investment
- **SIP**: Systematic Investment Plan (mutual fund) — treat as investment outflow
- **GOLD**: gold purchase on 6th of month — treat as investment outflow
- **"Cash short/extra"** = the sheet's name for Net Savings (Income − Expenses)
- **Decimal values**: kirana sometimes has paise (e.g. ₹2,524.66) — preserve as-is

---

## 15. QUICK REFERENCE — CATEGORY ORDER IN SHEET

```
1. INCOME
2. HOME
3. RENTAL HOME
4. ENTERTAINMENTS
5. FINANCIAL OBLIGATIONS
6. VACATIONS
7. RECREATION (2025) / UTENSILS (2026+)
8. PERSONAL
9. MISC PAYMENTS
10. TOTALS
11. Notes
```

---

*End of SKILL — Use this file to instruct Claude to create, edit, beautify, or extend Nik's personal budget Excel with perfect fidelity.*
SKILLEOF
echo "done" && wc -l /home/claude/budget_excel_skill.md
