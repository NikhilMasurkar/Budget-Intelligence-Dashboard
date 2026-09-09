// @vitest-environment jsdom
// The three components with real external dependencies: biometrics + Firebase
// (PinScreen), a data fetch on mount (ExportModal), and the Gemini proxy
// (AIInsightsSection). Those are stubbed so the test covers OUR rendering.
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { CATEGORIES, EXPENSES, INCOME, SEL_MONTHS, YEAR, noop } from '../test/fixtures'

vi.mock('../firebase', () => ({
  auth: { currentUser: { getIdToken: async () => 'tok' }, authStateReady: async () => {} },
  db: {},
  getFirebaseUid: () => 'uid_test',
}))

vi.mock('../api/biometric', () => ({
  isBiometricsAvailable: async () => true,
  hasBiometricCredential: () => false,
  registerBiometric: async () => true,
  verifyBiometric: async () => true,
  clearBiometric: noop,
}))

vi.mock('../api/firestoreSettings', () => ({
  hashPin: async (p) => `hash_${p}`,
  clearPinResetOtpFS: async () => {},
  resetPinFS: async () => {},
}))

vi.mock('../api/sheets', () => ({
  getToken: () => 'tok',
  fetchExpenses: async () => EXPENSES,
  fetchIncome: async () => INCOME,
}))

vi.mock('../api/gemini', () => ({
  AI_ENABLED: true,
  getAIInsights: async () => ({ summary: 'ok', insights: [] }),
  calcInstantScore: () => ({ score: 8, summary: 'Saving 60% of income.', employment: 'salaried' }),
  buildFinancialContext: () => 'context',
  getChatResponseStream: async () => {},
  calcIncomeTax: () => 0,
}))

import PinScreen from './PinScreen'
import ExportModal from './ExportModal'
import AIInsightsSection from './Dashboard/subcomponents/AIInsightsSection'

describe('PinScreen', () => {
  const base = { userName: 'Nikhil', sheetId: 'sheet_1',
    onVerify: async () => true, onUnlock: noop, onSetPin: async () => {} }

  it('renders in entry mode', () => {
    expect(() => render(<PinScreen {...base} mode="entry" />)).not.toThrow()
  })

  it('renders in setup mode — first run, before a PIN exists', () => {
    expect(() => render(<PinScreen {...base} mode="setup" />)).not.toThrow()
  })

  it('renders without a sheetId, which disables the biometric paths', () => {
    expect(() => render(<PinScreen {...base} mode="entry" sheetId={null} />)).not.toThrow()
  })

  it('renders without a userName', () => {
    expect(() => render(<PinScreen {...base} mode="entry" userName="" />)).not.toThrow()
  })
})

describe('ExportModal', () => {
  it('renders while its data is still loading', () => {
    expect(() => render(<ExportModal categories={CATEGORIES} onClose={noop} />)).not.toThrow()
  })

  it('renders with no categories', () => {
    expect(() => render(<ExportModal categories={[]} onClose={noop} />)).not.toThrow()
  })
})

describe('AIInsightsSection', () => {
  const base = { onClose: noop, expenses: EXPENSES, income: INCOME,
    categories: CATEGORIES, year: YEAR, selMonths: SEL_MONTHS, userName: 'Nikhil' }

  it('renders closed', () => {
    expect(() => render(<AIInsightsSection {...base} open={false} />)).not.toThrow()
  })

  it('renders open', () => {
    expect(() => render(<AIInsightsSection {...base} open={true} />)).not.toThrow()
  })

  it('renders open with nothing recorded', () => {
    expect(() => render(
      <AIInsightsSection {...base} open={true} expenses={[]} income={[]} />
    )).not.toThrow()
  })
})
