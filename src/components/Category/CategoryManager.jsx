import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { useCategoryManagerStyles } from './styles/Category.styles'

export default function CategoryManager({ categories, onEdit, onDelete, onReorder, canEdit }) {
  const { classes } = useCategoryManagerStyles()
  const [reordering, setReordering] = useState(false)
  const [localCats, setLocalCats] = useState(categories)

  // Sync when categories prop changes (after save, etc.)
  const catsToShow = reordering ? localCats : categories

  const startReorder = () => {
    setLocalCats([...categories])
    setReordering(true)
  }

  const moveItem = (fromIdx, toIdx) => {
    const updated = [...localCats]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setLocalCats(updated)
  }

  const saveOrder = () => {
    onReorder(localCats)
    setReordering(false)
  }

  const cancelReorder = () => {
    setReordering(false)
  }

  return (
    <Box className={classes.container}>
      {/* Reorder toggle buttons */}
      {canEdit && (
        <Box className={classes.actionHeader}>
          {reordering ? (
            <>
              <Button
                variant="contained"
                onClick={saveOrder}
                className={classes.saveButton}
              >
                💾 Save Order
              </Button>
              <Button
                variant="outlined"
                onClick={cancelReorder}
                className={classes.reorderButton}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              onClick={startReorder}
              className={classes.reorderButton}
            >
              ↕️ Reorder
            </Button>
          )}
        </Box>
      )}

      {/* Category List */}
      <Box className={classes.categoryList}>
        {catsToShow.length === 0 && (
          <Typography variant="body2" className={classes.emptyText}>
            No categories yet. Add one!
          </Typography>
        )}
        {catsToShow.map((cat, idx) => (
          <Box
            key={cat.id}
            className={classes.categoryCard}
            style={{
              borderStyle: reordering ? 'dashed' : 'solid',
              borderColor: reordering ? '#5b7fff' : 'rgba(255, 255, 255, 0.07)',
              opacity: reordering ? 0.9 : 1
            }}
          >
            {/* Reorder arrows — only in reorder mode */}
            {reordering && (
              <Box className={classes.reorderControls}>
                <IconButton
                  size="small"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, idx - 1)}
                  title="Move up"
                  className={classes.reorderButtonArrow}
                  style={{ opacity: idx === 0 ? 0.25 : 1 }}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={idx === catsToShow.length - 1}
                  onClick={() => moveItem(idx, idx + 1)}
                  title="Move down"
                  className={classes.reorderButtonArrow}
                  style={{ opacity: idx === catsToShow.length - 1 ? 0.25 : 1 }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Color Dot indicator */}
            <Box
              className={classes.colorDotBox}
              style={{
                background: `${cat.color || '#5b7fff'}22`,
                border: `1px solid ${cat.color || '#5b7fff'}33`
              }}
            >
              <Box
                className={classes.colorDotInner}
                style={{
                  background: cat.color || '#5b7fff'
                }}
              />
            </Box>

            {/* Category Info */}
            <Box className={classes.infoBox}>
              <Typography variant="subtitle2" className={classes.categoryName}>
                {cat.name}
              </Typography>
              <Typography variant="caption" className={classes.categoryType}>
                {cat.type}
              </Typography>
            </Box>

            {/* Action buttons (edit/delete) */}
            {canEdit && !reordering && (
              <Box className={classes.actionsBox}>
                <Tooltip title="Edit Category" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(cat)}
                    className={classes.actionButton}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Category" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(cat)}
                    className={classes.deleteButton}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
