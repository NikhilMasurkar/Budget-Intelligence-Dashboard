// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MonthStepper, { stepMonth } from './MonthStepper'

describe('stepMonth', () => {
  it('steps within a year', () => {
    expect(stepMonth(2026, 5, 1, [2026])).toEqual({ year: 2026, month: 6 })
    expect(stepMonth(2026, 5, -1, [2026])).toEqual({ year: 2026, month: 4 })
  })

  it('crosses a year boundary only into an available year', () => {
    expect(stepMonth(2026, 1, -1, [2025, 2026])).toEqual({ year: 2025, month: 12 })
    expect(stepMonth(2025, 12, 1, [2025, 2026])).toEqual({ year: 2026, month: 1 })
    expect(stepMonth(2026, 1, -1, [2026])).toBeNull()
    expect(stepMonth(2026, 12, 1, [2025, 2026])).toBeNull()
  })
})

describe('MonthStepper', () => {
  const prev = () => screen.getByRole('button', { name: 'Previous month' })
  const next = () => screen.getByRole('button', { name: 'Next month' })

  it('moves to December of the previous year when that year is available', () => {
    const onYearChange = vi.fn(), onMonthChange = vi.fn()
    render(<MonthStepper year={2026} month={1} availableYears={[2025, 2026]}
      onYearChange={onYearChange} onMonthChange={onMonthChange} />)
    fireEvent.click(prev())
    expect(onYearChange).toHaveBeenCalledWith(2025)
    expect(onMonthChange).toHaveBeenCalledWith(12)
    expect(next().disabled).toBe(false)
  })

  it('disables the arrow when the adjacent year is not available', () => {
    render(<MonthStepper year={2026} month={12} availableYears={[2026]}
      onYearChange={vi.fn()} onMonthChange={vi.fn()} />)
    expect(next().disabled).toBe(true)
    expect(prev().disabled).toBe(false)
  })
})
