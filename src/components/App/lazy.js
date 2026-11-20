import { lazy } from 'react'

// Not needed for first paint: Dashboard pulls chart.js, AI pulls gemini, Export is a modal.
export const loadDashboard = () => import('../Dashboard')
export const Dashboard = lazy(loadDashboard)
export const AIInsightsSection = lazy(() => import('../Dashboard/subcomponents/AIInsightsSection'))
export const ExportModal = lazy(() => import('../ExportModal'))
