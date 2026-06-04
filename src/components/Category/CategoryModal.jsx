import React, { useState, useEffect } from 'react'
import {
  Dialog,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import { useCategoryModalStyles } from './styles/Category.styles'

const BRIGHT_COLORS = [
  '#5b7fff', // Modern Blue
  '#52B788', // Emerald Green
  '#FF6B6B', // Coral Red
  '#FFB03A', // Warm Amber/Orange
  '#b366ff', // Bright Purple
  '#00d4ff', // Electric Cyan
  '#ff66cc', // Hot Pink
  '#ffd633', // Sunny Yellow
  '#80ff00', // Lime Green
  '#ff9933', // Tangerine
  '#6699ff', // Light Blue
  '#ff5050'  // Bright Red
]

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  let c = (1 - Math.abs(2 * l - 1)) * s
  let x = c * (1 - Math.abs((h / 60) % 2 - 1))
  let m = l - c / 2
  let r = 0, g = 0, b = 0
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }
  let r_hex = Math.round((r + m) * 255).toString(16).padStart(2, '0')
  let g_hex = Math.round((g + m) * 255).toString(16).padStart(2, '0')
  let b_hex = Math.round((b + m) * 255).toString(16).padStart(2, '0')
  return `#${r_hex}${g_hex}${b_hex}`
}

function getNextUniqueColor(existingCategories = []) {
  const existingColors = new Set(existingCategories.map(c => c.color?.toLowerCase()))
  for (const color of BRIGHT_COLORS) {
    if (!existingColors.has(color.toLowerCase())) {
      return color
    }
  }
  for (let i = 0; i < 50; i++) {
    const hue = Math.floor(Math.random() * 360)
    const color = hslToHex(hue, 85, 60)
    if (!existingColors.has(color.toLowerCase())) {
      return color
    }
  }
  return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)]
}

export default function CategoryModal({ open, initial, categories = [], onSave, onClose }) {
  const { classes } = useCategoryModalStyles()
  const [form, setForm] = useState({
    id: '',
    name: '',
    type: 'expense',
    color: '#5b7fff'
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const defaultColor = getNextUniqueColor(categories)
      setForm({
        id: initial?.id || '',
        name: initial?.name || '',
        type: initial?.type || 'expense',
        color: initial?.color || defaultColor
      })
      setSaving(false)
    }
  }, [open, initial, categories])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (form.name.trim() && !saving) {
      setSaving(true)
      try {
        await onSave({
          ...form,
          name: form.name.trim()
        })
        onClose()
      } catch (err) {
        console.error(err)
        setSaving(false)
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      className={classes.dialog}
    >
      <Box className={classes.content}>
        
        {/* Top Icon Badge */}
        <Box className={classes.iconBadge}>
          <CategoryOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
        </Box>

        {/* Title */}
        <Typography variant="h6" className={classes.title}>
          {initial ? 'Edit Category' : 'New Category'}
        </Typography>

        {/* Form Controls */}
        <Box className={classes.formContainer}>
          <TextField
            label="Category Name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Groceries"
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            className={classes.fieldStyles}
          />

          <FormControl fullWidth size="small" className={classes.fieldStyles}>
            <InputLabel id="category-type-label" shrink sx={{ color: 'text.secondary' }}>
              Type
            </InputLabel>
            <Select
              labelId="category-type-label"
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
              label="Type"
              notched
            >
              <MenuItem value="expense" sx={{ fontSize: 13 }}>Expense</MenuItem>
              <MenuItem value="fixed" sx={{ fontSize: 13 }}>Fixed Expense</MenuItem>
              <MenuItem value="savings" sx={{ fontSize: 13 }}>Savings / Investment</MenuItem>
              <MenuItem value="income" sx={{ fontSize: 13 }}>Income</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Actions */}
        <Box className={classes.actionsContainer}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className={classes.saveButton}
          >
            {saving ? 'Saving...' : 'Save Category'}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={saving}
            className={classes.cancelButton}
          >
            Cancel
          </Button>
        </Box>

      </Box>
    </Dialog>
  )
}
