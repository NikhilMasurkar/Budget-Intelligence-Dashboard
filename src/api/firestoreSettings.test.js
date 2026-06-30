import { describe, it, expect } from 'vitest'
import { hashPin } from './firestoreSettings'

describe('hashPin', () => {
  it('is deterministic — same input always produces the same hash', async () => {
    expect(await hashPin('1234')).toBe(await hashPin('1234'))
  })

  it('produces a 64-character lowercase hex string (SHA-256)', async () => {
    const h = await hashPin('1234')
    expect(h).toHaveLength(64)
    expect(h).toMatch(/^[0-9a-f]+$/)
  })

  it('different PINs produce different hashes', async () => {
    expect(await hashPin('1234')).not.toBe(await hashPin('4321'))
    expect(await hashPin('0000')).not.toBe(await hashPin('1111'))
  })

  it('known vector — SHA-256("1234") matches reference value', async () => {
    // Computed independently: echo -n "1234" | sha256sum
    expect(await hashPin('1234')).toBe(
      '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
    )
  })
})
