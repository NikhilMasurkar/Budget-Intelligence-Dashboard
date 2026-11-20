import { useCallback } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useStyles } from './App.styles'
import { useGlobalStyles } from '../../styles/globalStyles'
import { YearBanner } from './StatusBanner'
import ExpensesByCategory from '../Expenses/ExpensesByCategory'
import IncomeTable from '../Income/IncomeTable'
import MonthStepper from '../MonthStepper'

const TABS = [{ id: 'expenses', label: 'Expenses' }, { id: 'income', label: 'Income' }]

function IncomeSection({ app }) {
  const { classes } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()
  const { year, month, canEdit, openModal } = app
  return (
    <>
      <Box className={classes.headerRow}>
        <Typography variant="h5" className={classes.titleText}>Income</Typography>
        <MonthStepper year={year} month={month} availableYears={app.availableYears}
          onYearChange={app.setYear} onMonthChange={app.setMonth} />
        <Box className={classes.flexFiller} />
        {canEdit && (
          <Button variant="contained" size="small" className={globalClasses.containedBlueButton}
            onClick={() => openModal('add-income')}>
            + Add Income
          </Button>
        )}
      </Box>
      <IncomeTable
        income={app.yearIncome.filter(i => String(i.month) === String(month))}
        onEdit={row => openModal('add-income', row)}
        onDelete={app.handleDeleteIncome}
        canEdit={canEdit}
      />
    </>
  )
}

// The Expenses page: an Expenses / Income switch over the two lists.
export default function TransactionsView({ app }) {
  const { classes, cx } = useStyles()
  const { openModal, txnTab } = app
  // Stable, so the long expense list doesn't re-render on every App render.
  const onAddExpense = useCallback(catId => openModal('add-expense', catId ? { categoryId: catId } : null), [openModal])
  const onEditExpense = useCallback(row => openModal('add-expense', row), [openModal])
  const onAddCategory = useCallback(() => openModal('category'), [openModal])
  const onEditCategory = useCallback(row => openModal('category', row), [openModal])

  return (
    <>
      <YearBanner year={app.year} />
      <Box className={classes.txnTabs}>
        {TABS.map(tab => (
          <Button key={tab.id} size="small" onClick={() => app.setTxnTab(tab.id)}
            className={cx(classes.txnTab, txnTab === tab.id && classes.txnTabActive)}>
            {tab.label}
          </Button>
        ))}
      </Box>
      {txnTab === 'income' ? <IncomeSection app={app} /> : (
        <ExpensesByCategory
          expenses={app.yearExpenses}
          income={app.yearIncome}
          categories={app.categories}
          year={app.year}
          month={app.month}
          availableYears={app.availableYears}
          onYearChange={app.setYear}
          onMonthChange={app.setMonth}
          onAddExpense={onAddExpense}
          onEditExpense={onEditExpense}
          onDeleteExpense={app.handleDeleteExpense}
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={app.handleDeleteCategory}
          onReorderCategory={app.handleReorderCategory}
          onCopyToNextMonth={app.handleCopySelected}
          selectedIds={app.selectedExpenseIds}
          onSelectionChange={app.setSelectedExpenseIds}
          onBulkPin={app.handleBulkPin}
          onBulkDelete={app.handleBulkDelete}
          onSaveComment={app.handleSaveComment}
          canEdit={app.canEdit}
        />
      )}
    </>
  )
}
