import React, { useState, useEffect, useRef } from 'react'
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
  Drawer,
  List,
  ListItem,
  ListItemButton
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import GetAppIcon from '@mui/icons-material/GetApp'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LogoutIcon from '@mui/icons-material/Logout'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'

import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme) => ({
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  appBar: {
    backgroundColor: theme.palette.background.paper,
    borderBottom: '1px solid',
    borderColor: theme.palette.divider,
    zIndex: theme.zIndex.drawer + 1,
  },
  toolbar: {
    maxWidth: '1800px',
    width: '100%',
    margin: '0 auto',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '56px',
    [theme.breakpoints.up('md')]: {
      paddingLeft: '3%',
      paddingRight: '3%',
    },
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  menuButton: {
    display: 'flex',
    color: theme.palette.text.secondary,
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0.75),
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
    '&:hover': {
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
    },
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(1),
  },
  emoji: {
    fontSize: '22px',
  },
  brandName: {
    fontWeight: 800,
    fontSize: '16px',
    letterSpacing: '-0.5px',
    color: theme.palette.text.primary,
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  navGroup: {
    display: 'none',
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
    marginRight: 'auto',
    overflowX: 'auto',
    '&::-webkit-scrollbar': { display: 'none' },
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  navButton: {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    borderRadius: theme.spacing(1),
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    color: theme.palette.text.secondary,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
  },
  navButtonActive: {
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(91, 127, 255, 0.08)',
    '&:hover': {
      backgroundColor: 'rgba(91, 127, 255, 0.12)',
    },
  },
  actionGroup: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  actionButton: {
    color: theme.palette.text.secondary,
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0.75),
    '&:hover': {
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
    },
  },
  refreshIcon: {
    fontSize: '18px',
  },
  refreshIconSpin: {
    animation: 'spin 1s linear infinite',
  },
  svgIcon: {
    display: 'block',
  },
  downloadIcon: {
    fontSize: '18px',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    borderRadius: '20px',
    backgroundColor: theme.palette.background.default,
    border: '1px solid',
    borderColor: theme.palette.divider,
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
  },
  arrowIcon: {
    fontSize: '14px',
    color: theme.palette.text.secondary,
  },
  avatarSmall: {
    width: '24px',
    height: '24px',
    fontSize: '12px',
    fontWeight: 800,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
  },
  profileText: {
    fontWeight: 600,
    fontSize: '13px',
  },
  menuPaper: {
    marginTop: theme.spacing(1.5),
    width: '220px',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid',
    borderColor: theme.palette.divider,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    overflow: 'visible',
    padding: theme.spacing(1),
  },
  menuHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    borderBottom: '1px solid',
    borderColor: theme.palette.divider,
    marginBottom: theme.spacing(1),
  },
  avatarLarge: {
    width: '36px',
    height: '36px',
    fontSize: '14px',
    fontWeight: 800,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
  },
  menuInfo: {
    overflow: 'hidden',
  },
  menuTitle: {
    fontWeight: 700,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  menuSubtitle: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
  },
  menuSignOutItem: {
    color: theme.palette.error.main,
    fontWeight: 600,
    borderRadius: theme.spacing(1.5),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    '&:hover': {
      backgroundColor: 'rgba(255, 95, 95, 0.08)',
    },
  },
  menuSignOutIcon: {
    color: theme.palette.error.main,
    minWidth: '32px',
  },
  signOutText: {
    fontSize: '13px',
    fontWeight: 600,
  },
  signOutIcon: {
    fontSize: '18px',
  },
  signInButton: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  drawerPaper: {
    width: '260px',
    backgroundColor: '#101218',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundImage: 'none',
    padding: theme.spacing(2.5),
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  drawerEmoji: {
    fontSize: '22px',
  },
  drawerBrandName: {
    fontWeight: 800,
    fontSize: '16px',
    letterSpacing: '-0.5px',
    color: theme.palette.text.primary,
  },
  drawerList: {
    padding: theme.spacing(1.2),
  },
  drawerListItem: {
    marginBottom: theme.spacing(3),
  },
  drawerListItemButton: {
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0.8),
    color: theme.palette.text.secondary,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
  },
  drawerListItemButtonActive: {
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(91, 127, 255, 0.08)',
    '&:hover': {
      backgroundColor: 'rgba(91, 127, 255, 0.12)',
    },
  },
  drawerListItemIcon: {
    minWidth: '36px',
    color: theme.palette.text.secondary,
  },
  drawerListItemIconActive: {
    color: theme.palette.primary.main,
  },
  navIcon: {
    fontSize: '20px',
  },
}))

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
  hasAIKey
}) {
  const { classes, cx } = useStyles()
  const [anchorEl, setAnchorEl] = useState(null)
  const openMenu = Boolean(anchorEl)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const NAV_LABELS = { dashboard: 'Dashboard', expenses: 'Transactions' }

  const getNavIcon = (v) => {
    switch (v) {
      case 'dashboard': return <DashboardOutlinedIcon className={classes.navIcon} />
      case 'expenses':  return <ReceiptLongOutlinedIcon className={classes.navIcon} />
      default:          return null
    }
  }

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

  return (
    <AppBar position="sticky" elevation={0} className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        {/* LEFT BRANDING GROUP */}
        <Box className={classes.leftGroup}>
          {/* HAMBURGER MENU FOR MOBILE */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box className={classes.brandGroup}>
            <Typography variant="h5" className={classes.emoji}>
              💰
            </Typography>
            <Typography variant="h6" className={classes.brandName}>
              BudgetIQ
            </Typography>
          </Box>
        </Box>

        {/* NAVIGATION */}
        <Box className={classes.navGroup}>
          {['dashboard', 'expenses'].map((v) => {
            const isActive = view === v
            return (
              <Button
                key={v}
                onClick={() => setView(v)}
                className={cx(classes.navButton, isActive && classes.navButtonActive)}
              >
                {NAV_LABELS[v]}
              </Button>
            )
          })}
        </Box>

        {/* ACTIONS */}
        <Box className={classes.actionGroup}>
          {/* PWA install — shown when browser decides app is installable */}
          {installPrompt && (
            <Tooltip title="Install BudgetIQ as an app">
              <IconButton
                onClick={async () => {
                  installPrompt.prompt()
                  const { outcome } = await installPrompt.userChoice
                  if (outcome === 'accepted') setInstallPrompt(null)
                }}
                className={classes.actionButton}
                sx={{ color: '#3de8a0 !important', borderColor: 'rgba(61,232,160,0.4) !important' }}
              >
                <GetAppIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* iOS hint — Safari doesn't fire beforeinstallprompt */}
          {isIOS && !installPrompt && (
            <Tooltip
              title='Install: tap the Share icon in Safari, then "Add to Home Screen"'
              open={showIOSHint}
              onClose={() => setShowIOSHint(false)}
              disableFocusListener
              disableHoverListener
              disableTouchListener
            >
              <IconButton
                onClick={() => setShowIOSHint(v => !v)}
                className={classes.actionButton}
              >
                <GetAppIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {authd && hasAIKey && (
            <Tooltip title="AI Budget Insights — get simple tips on your spending" arrow>
              <IconButton onClick={onAIInsights} className={classes.actionButton}
                sx={{ color: '#a0b4ff !important', borderColor: 'rgba(91,127,255,0.35) !important',
                  '&:hover': { borderColor: 'rgba(91,127,255,0.7) !important', background: 'rgba(91,127,255,0.08) !important' }
                }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {authd && (
            <Tooltip title="Refresh from Google Sheets">
              <IconButton
                onClick={onRefresh}
                disabled={loading}
                className={classes.actionButton}
              >
                <RefreshIcon
                  className={cx(classes.refreshIcon, loading && classes.refreshIconSpin)}
                />
              </IconButton>
            </Tooltip>
          )}

          {authd && (
            <Tooltip title="Open in Google Drive">
              <IconButton onClick={onOpenDrive} className={classes.actionButton}>
                <svg width="18" height="18" viewBox="0 0 87.3 78" className={classes.svgIcon}>
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
                  <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.7c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47" />
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z" fill="#EA4335" />
                  <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D" />
                  <path d="M59.85 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.5c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC" />
                  <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.2 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
                </svg>
              </IconButton>
            </Tooltip>
          )}

          {authd && (
            <Tooltip title="Download to device">
              <IconButton onClick={onExportLocal} className={classes.actionButton}>
                <DownloadIcon className={classes.downloadIcon} />
              </IconButton>
            </Tooltip>
          )}

          {authd ? (
            <Box>
              <Button
                onClick={handleProfileClick}
                endIcon={<KeyboardArrowDownIcon className={classes.arrowIcon} />}
                className={classes.profileButton}
              >
                <Avatar
                  src={userPicture}
                  alt={userName}
                  className={classes.avatarSmall}
                >
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Typography variant="body2" className={classes.profileText}>
                  {userName}
                </Typography>
              </Button>

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

      {/* MOBILE DRAWER */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
        PaperProps={{
          className: classes.drawerPaper
        }}
      >
        <Box className={classes.drawerHeader}>
          <Typography variant="h5" className={classes.drawerEmoji}>
            💰
          </Typography>
          <Typography variant="h6" className={classes.drawerBrandName}>
            BudgetIQ
          </Typography>
        </Box>

        <List className={classes.drawerList}>
          {['dashboard', 'expenses'].map((v) => {
            const isActive = view === v
            return (
              <ListItem key={v} disablePadding className={classes.drawerListItem}>
                <ListItemButton
                  onClick={() => {
                    setView(v)
                    setMobileOpen(false)
                  }}
                  className={cx(classes.drawerListItemButton, isActive && classes.drawerListItemButtonActive)}
                >
                  <ListItemIcon
                    className={cx(classes.drawerListItemIcon, isActive && classes.drawerListItemIconActive)}
                  >
                    {getNavIcon(v)}
                  </ListItemIcon>
                  <ListItemText
                    primary={NAV_LABELS[v]}
                    primaryTypographyProps={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 700 : 600
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Drawer>
    </AppBar>
  )
}
