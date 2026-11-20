import { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Fab
} from '@mui/material'
import { toast } from 'react-hot-toast'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import GetAppIcon from '@mui/icons-material/GetApp'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LogoutIcon from '@mui/icons-material/Logout'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import { useThemeMode, setThemeMode } from '../theme/tokens'
import AddIcon from '@mui/icons-material/Add'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'

import { useTopBarStyles, useTopBarUi } from './styles/TopBar.styles'
import { APP_VERSION } from '../utils/constants'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardOutlinedIcon },
  { id: 'expenses', label: 'Transactions', Icon: ReceiptLongOutlinedIcon },
  { id: 'balance', label: 'Balance Sheet', Icon: AccountBalanceOutlinedIcon },
]

const IOS_HINT = 'Install: tap the Share icon in Safari, then "Add to Home Screen"'

export default function TopBar({
  view,
  setView,
  authd,
  loading,
  userName,
  userPicture,
  onRefresh,
  onExportLocal,
  onSignIn,
  onSignOut,
  onAIInsights,
  hasAIKey,
  notifStatus,
  onToggleNotifications,
  onAddExpense
}) {
  const { classes: ui, cx: uiCx } = useTopBarUi()
  const themeMode = useThemeMode()
  const { classes, cx } = useTopBarStyles()
  const [anchorEl, setAnchorEl] = useState(null)
  const openMenu = Boolean(anchorEl)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleSignOutClick = () => {
    handleCloseMenu()
    onSignOut()
  }

  // Each action is defined once: an icon button at md+, an avatar-menu item on phones.
  const install = installPrompt ? {
    key: 'install', label: 'Install app', tip: 'Install BudgetIQ as an app',
    icon: <GetAppIcon className={ui.installIcon} />,
    className: ui.actionOn,
    onClick: async () => {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') setInstallPrompt(null)
    }
  } : isIOS ? {
    // Safari doesn't fire beforeinstallprompt, so explain the manual route.
    key: 'install', label: 'Install app', tip: IOS_HINT,
    icon: <GetAppIcon className={ui.installIosIcon} />,
    onClick: () => toast(IOS_HINT, { id: 'ios-install', duration: 6000 })
  } : null

  const notif = authd && notifStatus !== 'unsupported' ? {
    key: 'notif',
    label: notifStatus === 'denied' ? 'Notifications blocked'
      : `Daily 10 PM reminder: ${notifStatus === 'subscribed' ? 'On' : 'Off'}`,
    tip: notifStatus === 'subscribed' ? '10 PM daily reminder ON — click to disable'
      : notifStatus === 'denied' ? 'Notifications blocked — enable in browser settings'
      : 'Enable daily 10 PM expense reminder',
    icon: notifStatus === 'subscribed' ? <NotificationsActiveIcon className={ui.reminderOnIcon} />
      : notifStatus === 'denied' ? <NotificationsOffIcon className={ui.reminderBlockedIcon} />
      : <NotificationsNoneIcon className={ui.reminderOffIcon} />,
    onClick: notifStatus !== 'denied' ? onToggleNotifications : undefined,
    disabled: notifStatus === 'loading',
    className: notifStatus === 'subscribed' ? ui.actionOn : notifStatus === 'denied' ? ui.actionDenied : undefined
  } : null

  const dataActions = authd ? [
    {
      key: 'refresh', label: 'Refresh data', tip: 'Refresh data',
      icon: <RefreshIcon className={cx(classes.refreshIcon, loading && classes.refreshIconSpin)} />,
      onClick: onRefresh, disabled: loading
    },
    { key: 'download', label: 'Download PDF', tip: 'Download a PDF report', icon: <DownloadIcon className={classes.downloadIcon} />, onClick: onExportLocal },
  ] : []

  // Signed out there is no avatar menu, so install stays in the bar at every width.
  const renderIcon = (a) => a && (
    <Tooltip key={a.key} title={a.tip}>
      <span className={cx(classes.iconWrap, authd && classes.desktopOnly)}>
        <IconButton aria-label={a.label} onClick={a.onClick} disabled={a.disabled} className={cx(classes.actionButton, a.className)}>
          {a.icon}
        </IconButton>
      </span>
    </Tooltip>
  )

  return (
    <>
    <AppBar position="sticky" elevation={0} className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        {/* LEFT BRANDING GROUP */}
        <Box className={classes.leftGroup}>
          <Box className={classes.brandGroup}>
            <Typography variant="h5" className={classes.emoji}>
              💰
            </Typography>
            <Typography variant="h6" className={classes.brandName}>
              BudgetIQ
            </Typography>
          </Box>
        </Box>

        {/* NAVIGATION (md+; phones use the bottom bar) */}
        <Box className={classes.navGroup}>
          {NAV.map(({ id, label }) => (
            <Button
              key={id}
              onClick={() => setView(id)}
              className={cx(classes.navButton, view === id && classes.navButtonActive)}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* ACTIONS */}
        <Box className={classes.actionGroup}>
          {renderIcon(install)}

          {authd && hasAIKey && (
            <Tooltip title="AI Budget Insights — get simple tips on your spending" arrow>
              <IconButton onClick={onAIInsights} className={uiCx(classes.actionButton, ui.aiButton)} aria-label="AI Budget Insights"
               >
                <AutoAwesomeIcon className={ui.aiIcon} />
              </IconButton>
            </Tooltip>
          )}

          {renderIcon(notif)}
          {dataActions.map(renderIcon)}

          {authd ? (
            <Box>
              <Tooltip title="Account">
                <IconButton
                  onClick={handleProfileClick}
                  className={classes.profileButton}
                  aria-label="Account menu"
                >
                  <Avatar
                    src={userPicture}
                    alt={userName}
                    className={classes.avatarSmall}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
                PaperProps={{
                  elevation: 0,
                  className: classes.menuPaper
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box className={classes.menuHeader}>
                  <Avatar
                    src={userPicture}
                    alt={userName}
                    className={classes.avatarLarge}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Box className={classes.menuInfo}>
                    <Typography variant="subtitle2" className={classes.menuTitle}>
                      {userName}
                    </Typography>
                    <Typography variant="caption" className={classes.menuSubtitle}>
                      Google Account
                    </Typography>
                  </Box>
                </Box>

                {/* Phone-only: the bar's actions, as labelled items */}
                {[...dataActions, notif, install].filter(Boolean).map(a => (
                  <MenuItem
                    key={a.key}
                    onClick={a.onClick}
                    disabled={a.disabled || !a.onClick}
                    className={cx(classes.menuItem, classes.phoneOnly)}
                  >
                    <ListItemIcon className={classes.menuItemIcon}>{a.icon}</ListItemIcon>
                    <ListItemText primary={a.label} primaryTypographyProps={{ className: classes.signOutText }} />
                  </MenuItem>
                ))}

                <MenuItem
                  onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                  className={classes.menuItem}
                >
                  <ListItemIcon className={classes.menuItemIcon}>
                    {themeMode === 'dark' ? <LightModeOutlinedIcon className={ui.lightModeIcon} /> : <DarkModeOutlinedIcon className={ui.darkModeIcon} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={themeMode === 'dark' ? 'Light theme' : 'Dark theme'}
                    primaryTypographyProps={{ className: classes.signOutText }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={handleSignOutClick}
                  className={classes.menuSignOutItem}
                >
                  <ListItemIcon className={classes.menuSignOutIcon}>
                    <LogoutIcon className={classes.signOutIcon} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sign Out"
                    primaryTypographyProps={{
                      className: classes.signOutText
                    }}
                  />
                </MenuItem>

                <Typography className={ui.versionText}
                  variant="caption"
                >
                  BudgetIQ v{APP_VERSION}
                </Typography>
              </Menu>
            </Box>
          ) : onSignIn && (
            <Button
              variant="contained"
              size="small"
              onClick={onSignIn}
              className={classes.signInButton}
            >
              🔑 Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>

    {/* PHONE BOTTOM NAV (hidden at md+ via CSS) */}
    {authd && (
      <Box component="nav" aria-label="Main" className={classes.bottomNav}>
        <BottomNavigation showLabels value={view} onChange={(_, v) => setView(v)} className={classes.bottomNavInner}>
          {NAV.map(({ id, label, Icon }) => (
            <BottomNavigationAction
              key={id}
              value={id}
              label={label}
              icon={<Icon className={classes.navIcon} />}
              aria-current={view === id ? 'page' : undefined}
              className={classes.bottomNavAction}
            />
          ))}
        </BottomNavigation>
      </Box>
    )}

    {onAddExpense && (
      <Fab color="primary" aria-label="Add expense" onClick={onAddExpense} className={classes.fab}>
        <AddIcon />
      </Fab>
    )}
    </>
  )
}
