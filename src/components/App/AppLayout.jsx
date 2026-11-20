import { Toaster } from 'react-hot-toast'
import { Box } from '@mui/material'
import { useStyles } from './App.styles'
import { useGlobalStyles } from '../../styles/globalStyles'
import { AI_ENABLED } from '../../utils/constants'
import ConfigScreen from '../ConfigScreen'
import PinScreen from '../PinScreen'
import SignInScreen from '../SignInScreen'
import TopBar from '../TopBar'
import ErrorBoundary from '../ErrorBoundary'
import BalanceSheet from '../BalanceSheet'
import { OfflineBanner } from './StatusBanner'
import Loading from './Loading'
import DashboardView from './DashboardView'
import TransactionsView from './TransactionsView'
import AppModals from './AppModals'

function Page({ app }) {
  const { authd, checking, didInitialLoad, view } = app
  if (!authd) return checking ? <Loading /> : <SignInScreen onSignIn={app.handleSignIn} />
  return (
    <>
      {app.offline && <OfflineBanner />}
      {/* Full-screen loading only on the very first load — after that, keep
          content mounted so the UI doesn't blank out on every save/refresh. */}
      {app.loading && !didInitialLoad && <Loading text="Loading your budget…" />}
      {didInitialLoad && (
        <ErrorBoundary key={view}>
          {view === 'dashboard' && <DashboardView app={app} />}
          {view === 'balance' && <BalanceSheet allExpenses={app.expenses} allIncome={app.income} categories={app.categories} />}
          {view === 'expenses' && <TransactionsView app={app} />}
        </ErrorBoundary>
      )}
    </>
  )
}

export default function AppLayout({ app }) {
  const { classes } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()
  const { authd, didInitialLoad, isLocked } = app

  if (app.missingConfig) return <ConfigScreen />
  if (app.pinScreen) return <PinScreen {...app.pinScreen} />

  return (
    <Box className={globalClasses.globalContainer}>
      <Toaster position="top-right" toastOptions={{ className: classes.toast }} />
      <TopBar
        view={app.view}
        setView={app.setView}
        authd={authd}
        loading={app.loading}
        userName={app.userName}
        userPicture={app.userPicture}
        onRefresh={app.refresh}
        onExportLocal={() => app.openModal('export')}
        onSignIn={app.checking ? undefined : app.handleSignIn}
        onSignOut={app.signOut}
        onAIInsights={app.showAI}
        hasAIKey={AI_ENABLED}
        notifStatus={app.notifStatus}
        onToggleNotifications={app.handleToggleNotifications}
        onAddExpense={authd && didInitialLoad && !isLocked ? () => app.openModal('add-expense') : undefined}
      />
      <Box className={globalClasses.contentArea}>
        <Page app={app} />
      </Box>
      <AppModals app={app} />
    </Box>
  )
}
