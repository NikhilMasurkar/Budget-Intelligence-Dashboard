import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useStyles } from '../styles/MonthFilterControl.styles'

export default function MonthFilterControl({ selMonths, setSelMonths, MONTHS, defaultMonths, year }) {
  const { classes, cx } = useStyles()

  const toggleMonth = (i) => {
    const isSelected = selMonths.includes(i)
    setSelMonths(s =>
      isSelected
        ? (s.length > 1 ? s.filter(x => x !== i) : s)
        : [...s, i].sort((a, b) => a - b)
    )
  }

  const selectAll = () => {
    if (selMonths.length === 12) {
      setSelMonths([])
    } else {
      setSelMonths([...Array(12).keys()])
    }
  }

  return (
    <Box className={classes.container}>
      <Typography variant="body2" className={classes.filterLabel}>
        Filter:
      </Typography>

      {/* Month Buttons */}
      {MONTHS.map((m, i) => {
        const isSelected = selMonths.includes(i)
        return (
          <Button
            key={i}
            onClick={() => toggleMonth(i)}
            size="small"
            className={cx(classes.buttonCommon, isSelected && classes.buttonActive)}
          >
            {m}
          </Button>
        )
      })}

      {/* Vertical Divider */}
      <Box className={classes.divider} />

      {/* Quarters & Halves */}
      {[
        { label: 'Q1', months: [0, 1, 2] },
        { label: 'Q2', months: [3, 4, 5] },
        { label: 'Q3', months: [6, 7, 8] },
        { label: 'Q4', months: [9, 10, 11] },
        { label: 'H1', months: [0, 1, 2, 3, 4, 5] },
        { label: 'H2', months: [6, 7, 8, 9, 10, 11] },
      ].map(q => {
        const isActive = q.months.every(m => selMonths.includes(m)) && selMonths.length === q.months.length
        return (
          <Button
            key={q.label}
            onClick={() => {
              if (isActive) {
                setSelMonths([])
              } else {
                setSelMonths(q.months)
              }
            }}
            size="small"
            className={cx(classes.qButtonCommon, isActive && classes.qButtonActive)}
          >
            {q.label}
          </Button>
        )
      })}

      {/* All Button */}
      <Button
        onClick={selectAll}
        size="small"
        className={cx(classes.qButtonCommon, selMonths.length === 12 && classes.qButtonActive)}
      >
        All
      </Button>
    </Box>
  )
}
