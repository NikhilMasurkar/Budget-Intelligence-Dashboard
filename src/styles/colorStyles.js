import { makeStyles } from 'tss-react/mui'

// A colour that comes from data (a category's chosen colour), as classes.
export const useColorStyles = makeStyles()((_theme, color) => ({
  text: { color },
  background: { background: color },
}))
