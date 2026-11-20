import { Box } from '@mui/material'
import { useColorStyles } from '../styles/colorStyles'

// A dot filled with a category's own colour.
export default function ColorDot({ color, className }) {
  const { classes, cx } = useColorStyles(color)
  return <Box className={cx(className, classes.background)} />
}
