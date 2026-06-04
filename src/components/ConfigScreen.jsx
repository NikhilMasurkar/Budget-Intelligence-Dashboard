import React from 'react'
import { Box, Container, Card, CardContent, Typography } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme) => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  card: {
    borderRadius: theme.spacing(2),
    border: '1px solid',
    borderColor: theme.palette.divider,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3),
    },
  },
  headerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  icon: {
    fontSize: '36px',
  },
  title: {
    fontWeight: 800,
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    lineHeight: 1.7,
  },
  codeInline: {
    fontFamily: 'monospace',
    backgroundColor: theme.palette.background.default,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    borderRadius: theme.spacing(0.5),
    border: '1px solid',
    borderColor: theme.palette.divider,
  },
  preCode: {
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2.5),
    fontSize: '13px',
    color: theme.palette.secondary.main,
    lineHeight: 1.8,
    overflowX: 'auto',
    fontFamily: 'monospace',
    border: '1px solid',
    borderColor: theme.palette.divider,
    marginBottom: theme.spacing(3),
  },
  infoBox: {
    padding: theme.spacing(2),
    backgroundColor: 'rgba(91, 127, 255, 0.05)',
    borderRadius: theme.spacing(1),
    border: '1px solid rgba(91, 127, 255, 0.15)',
    fontSize: '13px',
    color: theme.palette.text.secondary,
    lineHeight: 1.8,
  },
  strongText: {
    color: theme.palette.text.primary,
  },
}))

export default function ConfigScreen() {
  const { classes } = useStyles()

  return (
    <Container maxWidth="sm" className={classes.container}>
      <Card className={classes.card}>
        <CardContent>
          <Box className={classes.headerBox}>
            <SettingsIcon color="primary" className={classes.icon} />
            <Typography variant="h5" className={classes.title}>
              Setup Required
            </Typography>
          </Box>

          <Typography variant="body1" className={classes.description}>
            Create a{' '}
            <Box component="code" className={classes.codeInline}>
              .env
            </Box>{' '}
            file in your project root folder and specify the following keys:
          </Typography>

          <Box component="pre" className={classes.preCode}>
            {`VITE_GOOGLE_SHEETS_API_KEY=your_api_key\nVITE_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id`}
          </Box>

          <Box className={classes.infoBox}>
            📖 See{' '}
            <Box component="strong" className={classes.strongText}>
              SETUP.md
            </Box>{' '}
            in the project folder for step-by-step instructions on setting up your Google Cloud project credentials.
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

