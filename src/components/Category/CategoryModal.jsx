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

export default function CategoryModal({ open, initial, onSave, onClose }) {
  const { classes } = useCategoryModalStyles()
  const [form, setForm] = useState({
    id: '',
    name: '',
    type: 'expense',
    color: '#5b7fff'
  })

  useEffect(() => {
    if (open) {
      setForm({
        id: initial?.id || '',
        name: initial?.name || '',
        type: initial?.type || 'expense',
        color: initial?.color || '#5b7fff'
      })
    }
  }, [open, initial])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (form.name.trim()) {
      onSave({
        ...form,
        name: form.name.trim()
      })
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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

          {/* Color Picker & Preview */}
          <Box style={{ width: '100%' }}>
            <Typography variant="caption" className={classes.colorPickerLabel}>
              Category Color
            </Typography>
            <Box className={classes.colorPickerRow}>
              <Box
                component="input"
                type="color"
                value={form.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className={classes.colorInput}
              />
              <Box
                className={classes.colorPreview}
                style={{
                  backgroundColor: `${form.color}15`,
                  border: `1px solid ${form.color}40`
                }}
              >
                <Typography
                  variant="caption"
                  className={classes.colorPreviewText}
                  style={{ color: form.color }}
                >
                  PREVIEW TEXT
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Actions */}
        <Box className={classes.actionsContainer}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim()}
            className={classes.saveButton}
          >
            Save Category
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            className={classes.cancelButton}
          >
            Cancel
          </Button>
        </Box>

      </Box>
    </Dialog>
  )
}
