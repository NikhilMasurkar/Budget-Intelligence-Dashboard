import React from 'react'
import {
  Dialog,
  Button,
  Box,
  Typography
} from '@mui/material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '380px',
      width: 'calc(100% - 32px)',
      margin: theme.spacing(2),
      borderRadius: theme.spacing(3),
      border: '1px solid rgba(255, 255, 255, 0.13)',
      backgroundColor: '#101218',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
    },
  },
  container: {
    padding: theme.spacing(2.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3.5),
    },
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 95, 95, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2.5),
    border: '1px solid rgba(255, 95, 95, 0.25)',
    boxShadow: '0 0 12px rgba(255, 95, 95, 0.1)',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    fontWeight: 800,
    fontSize: '16px',
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
    letterSpacing: '-0.01em',
  },
  description: {
    color: theme.palette.text.secondary,
    fontSize: '12.5px',
    lineHeight: 1.6,
    marginBottom: theme.spacing(3.5),
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.25),
    width: '100%',
  },
  deleteBtn: {
    width: '100%',
    paddingTop: theme.spacing(1.15),
    paddingBottom: theme.spacing(1.15),
    fontWeight: 700,
    borderRadius: theme.spacing(2),
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(255, 95, 95, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(255, 95, 95, 0.3)',
    },
  },
  btnGroup: {
    display: 'flex',
    gap: theme.spacing(1.25),
    width: '100%',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
    },
  },
  monthBtn: {
    flex: 1,
    paddingTop: theme.spacing(1.15),
    paddingBottom: theme.spacing(1.15),
    fontWeight: 700,
    borderRadius: theme.spacing(2),
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(255, 95, 95, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(255, 95, 95, 0.3)',
    },
  },
  yearBtn: {
    flex: 1,
    paddingTop: theme.spacing(1.15),
    paddingBottom: theme.spacing(1.15),
    fontWeight: 700,
    borderRadius: theme.spacing(2),
    fontSize: '13px',
    backgroundColor: '#8B0000',
    boxShadow: '0 4px 12px rgba(139, 0, 0, 0.2)',
    '&:hover': {
      backgroundColor: '#6B0000',
      boxShadow: '0 6px 16px rgba(139, 0, 0, 0.3)',
    },
  },
  cancelBtn: {
    width: '100%',
    paddingTop: theme.spacing(0.9),
    paddingBottom: theme.spacing(0.9),
    borderRadius: theme.spacing(2),
    borderColor: theme.palette.divider,
    color: theme.palette.text.secondary,
    fontSize: '13px',
    fontWeight: 600,
    '&:hover': {
      borderColor: theme.palette.text.primary,
      color: theme.palette.text.primary,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
  },
}))

export default function DeleteConfirmModal({ open, item, type, onDelete, onClose }) {
  const { classes } = useStyles()

  if (!item) return null

  const displayName = type === 'expense'
    ? item.itemName
    : type === 'income'
      ? item.source
      : item.name

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
    >
      <Box className={classes.container}>
        {/* Red Circle Icon */}
        <Box className={classes.iconContainer}>
          <DeleteOutlinedIcon color="error" className={classes.icon} />
        </Box>

        {/* Title */}
        <Typography variant="h6" className={classes.title}>
          Delete {displayName}?
        </Typography>

        {/* Description */}
        <Typography variant="body2" className={classes.description}>
          {type === 'category'
            ? 'Are you sure you want to delete this category? Expenses using it will keep the old ID.'
            : `Choose whether to delete this entry for the selected month only, or remove it from all months in ${item?.year || ''}.`}
        </Typography>

        {/* Actions Box */}
        <Box className={classes.actionGroup}>
          {type === 'category' ? (
            <Button
              variant="contained"
              color="error"
              onClick={() => onDelete()}
              className={classes.deleteBtn}
            >
              Delete Category
            </Button>
          ) : (
            <Box className={classes.btnGroup}>
              <Button
                variant="contained"
                color="error"
                onClick={() => onDelete('month')}
                className={classes.monthBtn}
              >
                🗓 This Month
              </Button>
              <Button
                variant="contained"
                onClick={() => onDelete('year')}
                className={classes.yearBtn}
              >
                📅 Whole Year
              </Button>
            </Box>
          )}
          <Button
            variant="outlined"
            onClick={onClose}
            className={classes.cancelBtn}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
