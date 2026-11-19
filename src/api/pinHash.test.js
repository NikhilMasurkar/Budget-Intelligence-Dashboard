import { describe, it, expect, vi } from 'vitest'

vi.mock('../firebase', () => ({ db: {}, getFirebaseUid: () => null }))
import { makePinHash, checkPin, hashPin, isLegacyPinHash } from './firestoreSettings'

describe('PIN hashing', () => {
  it('salts every hash and verifies only the right PIN', async () => {
    const a = await makePinHash('1234'), b = await makePinHash('1234')
    expect(a).not.toBe(b)
    expect(await checkPin('1234', a)).toBe(true)
    expect(await checkPin('1235', a)).toBe(false)
    expect(isLegacyPinHash(a)).toBe(false)
  })
  it('still accepts a PIN stored the old way', async () => {
    const old = await hashPin('1234')
    expect(isLegacyPinHash(old)).toBe(true)
    expect(await checkPin('1234', old)).toBe(true)
    expect(await checkPin('0000', old)).toBe(false)
    expect(await checkPin('1234', null)).toBe(false)
  })
})
