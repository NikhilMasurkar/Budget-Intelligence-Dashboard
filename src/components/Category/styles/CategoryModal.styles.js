import { makeStyles } from 'tss-react/mui'

// Styles for CategoryModal.jsx.
export const useCategoryModalUi = makeStyles()((theme) => ({
  headerIcon: {
    fontSize: 28,
  },
  typeLabel: {
    color: theme.palette.text.secondary,
  },
  expenseOption: {
    fontSize: 13,
  },
  savingsOption: {
    fontSize: 13,
  },
}))
