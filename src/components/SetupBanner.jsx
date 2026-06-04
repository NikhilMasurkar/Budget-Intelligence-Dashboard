import React from 'react'
import { Paper, Box, Typography, Button } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme) => ({
  paper: {
    backgroundColor: 'rgba(255, 95, 95, 0.08)',
    border: '1px solid rgba(255, 95, 95, 0.25)',
    padding: theme.spacing(3),
    borderRadius: theme.spacing(3),
    textAlign: 'center',
    marginBottom: theme.spacing(3),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(4),
    },
  },
  iconContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 95, 95, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    border: '1px solid rgba(255, 95, 95, 0.2)',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    fontWeight: 800,
    marginBottom: theme.spacing(1),
    color: theme.palette.error.main,
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: '450px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  actionBtn: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    fontWeight: 700,
    textTransform: 'none',
    borderRadius: theme.spacing(2),
  },
}))

export default function SetupBanner({ authd, onSetup, onSignIn }) {
  const { classes } = useStyles()

  return (
    <Paper elevation={0} className={classes.paper}>
      <Box className={classes.iconContainer}>
        <BuildIcon color="error" className={classes.icon} />
      </Box>

      <Typography variant="h6" className={classes.title}>
        Google Sheet Setup Required
      </Typography>

      <Typography variant="body2" className={classes.description}>
        We couldn't find the required tabs (Categories, Expenses, Income) in your spreadsheet database. Click below to automatically create them.
      </Typography>

      {authd ? (
        <Button
          variant="contained"
          color="error"
          onClick={onSetup}
          className={classes.actionBtn}
        >
          Auto-Setup Sheets Now
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={onSignIn}
          className={classes.actionBtn}
        >
          Sign In to Auto-Setup
        </Button>
      )}
    </Paper>
  )
}
