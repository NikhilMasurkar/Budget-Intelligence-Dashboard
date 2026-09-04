import { makeStyles } from 'tss-react/mui'

export const useTopBarStyles = makeStyles()((theme) => ({
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
    padding: theme.spacing(0.5),
    borderRadius: '50%',
    border: '1px solid',
    borderColor: theme.palette.divider,
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: theme.palette.primary.main,
    },
  },
  avatarSmall: {
    width: '30px',
    height: '30px',
    fontSize: '13px',
    fontWeight: 800,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
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
