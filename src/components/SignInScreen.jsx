import React from 'react'
import { Box, Button, Container, Paper, Typography } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import GoogleIcon from '@mui/icons-material/Google'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme) => ({
  container: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  paper: {
    borderRadius: theme.spacing(2),
    border: '1px solid',
    borderColor: theme.palette.divider,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(4),
    textAlign: 'center',
    width: '100%',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
    animation: 'fadeIn 0.3s ease-out',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(6),
    },
  },
  iconContainer: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'rgba(91, 127, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px auto',
    border: '1px solid rgba(91, 127, 255, 0.2)',
  },
  icon: {
    fontSize: '36px',
  },
  title: {
    fontWeight: 800,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(4),
    maxWidth: '380px',
    margin: '0 auto 32px auto',
    lineHeight: 1.6,
  },
  signInBtn: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    fontSize: '15px',
    fontWeight: 700,
    borderRadius: '30px',
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    boxShadow: '0 4px 16px rgba(91, 127, 255, 0.3)',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#4a6eee',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(91, 127, 255, 0.4)',
    },
  },
}))

export default function SignInScreen({ onSignIn }) {
  const { classes } = useStyles()

  return (
    <Container maxWidth="sm" className={classes.container}>
      <Paper elevation={0} className={classes.paper}>
        <Box className={classes.iconContainer}>
          <LockOutlinedIcon color="primary" className={classes.icon} />
        </Box>

        <Typography variant="h4" className={classes.title}>
          Sign In Required
        </Typography>

        <Typography variant="body1" className={classes.description}>
          For your security and privacy, this monthly budget tracker is locked. Please sign in with your Google Account to sync and view your budget sheets.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={onSignIn}
          startIcon={<GoogleIcon />}
          className={classes.signInBtn}
        >
          Sign In with Google
        </Button>
      </Paper>
    </Container>
  )
}
