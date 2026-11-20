import { Suspense } from 'react'
import AddExpenseModal from '../Expenses/AddExpenseModal'
import AddIncomeModal from '../Income/AddIncomeModal'
import CategoryModal from '../Category/CategoryModal'
import DeleteConfirmModal from '../DeleteConfirmModal'
import ErrorBoundary from '../ErrorBoundary'
import { ExportModal, AIInsightsSection } from './lazy'

// Every dialog the app can open; app.modal says which one is up.
export default function AppModals({ app }) {
  const { modal, editRow, closeModal, categories, year, month, availableYears } = app
  return (
    <>
      {modal === 'add-expense' && (
        <AddExpenseModal
          initial={editRow}
          categories={categories}
          year={year}
          month={month}
          availableYears={availableYears}
          holdings={app.investmentHoldings}
          suggestions={app.itemSuggestions}
          expenses={app.expenses}
          onSave={app.handleSaveExpense}
          onClose={closeModal}
        />
      )}
      {modal === 'add-income' && (
        <AddIncomeModal
          initial={editRow}
          year={year}
          month={month}
          availableYears={availableYears}
          suggestions={app.sourceSuggestions}
          onSave={app.handleSaveIncome}
          onClose={closeModal}
        />
      )}
      <CategoryModal
        open={modal === 'category'}
        initial={editRow}
        categories={categories}
        onSave={app.handleSaveCategory}
        onClose={closeModal}
      />
      {modal === 'export' && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ExportModal categories={categories} onClose={closeModal} onRestored={app.loadAll} />
          </Suspense>
        </ErrorBoundary>
      )}
      <DeleteConfirmModal
        open={!!app.deleteConfirm}
        item={app.deleteConfirm?.item}
        type={app.deleteConfirm?.type}
        onDelete={app.executeDelete}
        onClose={() => app.setDeleteConfirm(null)}
      />
      {app.aiMounted && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <AIInsightsSection
              open={app.aiOpen}
              onClose={app.hideAI}
              expenses={app.yearExpenses}
              income={app.yearIncome}
              categories={categories}
              year={year}
              selMonths={app.selMonths}
              userName={app.userFullName || app.userName}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  )
}
