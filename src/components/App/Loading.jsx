import { Typography } from '@mui/material'
import { useStyles } from './App.styles'

export default function Loading({ text = 'Loading…' }) {
  const { classes } = useStyles()
  return <Typography className={classes.loadingText}>{text}</Typography>
}
