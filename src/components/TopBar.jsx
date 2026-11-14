import React, { useState, useEffect } from 'react'
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
import AddIcon from '@mui/icons-material/Add'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'

import { useTopBarStyles } from './styles/TopBar.styles'
import { APP_VERSION } from '../utils/constants'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardOutlinedIcon },
  { id: 'expenses', label: 'Transactions', Icon: ReceiptLongOutlinedIcon },
  { id: 'balance', label: 'Balance Sheet', Icon: AccountBalanceOutlinedIcon },
]

const IOS_HINT = 'Install: tap the Share icon in Safari, then "Add to Home Screen"'

const driveIcon = (className) => (
  <svg width="18" height="18" viewBox="0 0 87.3 78" className={className}>
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
    <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.7c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47" />
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z" fill="#EA4335" />
    <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D" />
    <path d="M59.85 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.5c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC" />
    <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.2 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
  </svg>
)

export default function TopBar({
  view,
  setView,
  authd,
  loading,
  userName,
  userPicture,
  onRefresh,
  onOpenDrive,
  onExportLocal,
  onSignIn,
  onSignOut,
  onAIInsights,
  hasAIKey,
  notifStatus,
  onToggleNotifications,
  onAddExpense
}) {
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
    icon: <GetAppIcon sx={{ fontSize: 18 }} />,
    sx: { color: '#3de8a0 !important', borderColor: 'rgba(61,232,160,0.4) !important' },
    onClick: async () => {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') setInstallPrompt(null)
    }
  } : isIOS ? {
    // Safari doesn't fire beforeinstallprompt, so explain the manual route.
    key: 'install', label: 'Install app', tip: IOS_HINT,
    icon: <GetAppIcon sx={{ fontSize: 18 }} />,
    onClick: () => toast(IOS_HINT, { id: 'ios-install', duration: 6000 })
  } : null

  const notif = authd && notifStatus !== 'unsupported' ? {
    key: 'notif',
    label: notifStatus === 'denied' ? 'Notifications blocked'
      : `Daily 9 PM reminder: ${notifStatus === 'subscribed' ? 'On' : 'Off'}`,
    tip: notifStatus === 'subscribed' ? '9 PM daily reminder ON — click to disable'
      : notifStatus === 'denied' ? 'Notifications blocked — enable in browser settings'
      : 'Enable daily 9 PM expense reminder',
    icon: notifStatus === 'subscribed' ? <NotificationsActiveIcon sx={{ fontSize: 18 }} />
      : notifStatus === 'denied' ? <NotificationsOffIcon sx={{ fontSize: 18 }} />
      : <NotificationsNoneIcon sx={{ fontSize: 18 }} />,
    onClick: notifStatus !== 'denied' ? onToggleNotifications : undefined,
    disabled: notifStatus === 'loading',
    sx: notifStatus === 'subscribed' ? { color: '#3de8a0 !important', borderColor: 'rgba(61,232,160,0.4) !important' }
      : notifStatus === 'denied' ? { opacity: 0.45, cursor: 'default' } : undefined
  } : null

  const dataActions = authd ? [
    {
      key: 'refresh', label: 'Refresh data', tip: 'Refresh from Google Sheets',
      icon: <RefreshIcon className={cx(classes.refreshIcon, loading && classes.refreshIconSpin)} />,
      onClick: onRefresh, disabled: loading
    },
    { key: 'drive', label: 'Open in Google Drive', tip: 'Open in Google Drive', icon: driveIcon(classes.svgIcon), onClick: onOpenDrive },
    { key: 'download', label: 'Download', tip: 'Download to device', icon: <DownloadIcon className={classes.downloadIcon} />, onClick: onExportLocal },
  ] : []

  // Signed out there is no avatar menu, so install stays in the bar at every width.
  const renderIcon = (a) => a && (
    <Tooltip key={a.key} title={a.tip}>
      <span className={cx(classes.iconWrap, authd && classes.desktopOnly)}>
        <IconButton aria-label={a.label} onClick={a.onClick} disabled={a.disabled} className={classes.actionButton} sx={a.sx}>
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
              <IconButton onClick={onAIInsights} className={classes.actionButton} aria-label="AI Budget Insights"
                sx={{ color: '#a0b4ff !important', borderColor: 'rgba(91,127,255,0.35) !important',
                  '&:hover': { borderColor: 'rgba(91,127,255,0.7) !important', background: 'rgba(91,127,255,0.08) !important' }
                }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
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

                <Typography
                  variant="caption"
                  sx={{ display: 'block', textAlign: 'center', color: '#4a5072', fontSize: 10, py: '6px' }}
                >
                  BudgetIQ v{APP_VERSION}
                </Typography>
              </Menu>
            </Box>
          ) : (
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
