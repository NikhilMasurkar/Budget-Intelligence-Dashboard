import { describe, it, expect } from 'vitest'
import { parseComments, appendComment } from './comments'

describe('parseComments', () => {
  it('reads a JSON thread', () => {
    expect(parseComments('[{"text":"a","ts":1}]')).toEqual([{ text: 'a', ts: 1 }])
  })
  it('treats a legacy plain-string note as one comment', () => {
    expect(parseComments('just a note')).toEqual([{ text: 'just a note', ts: 0 }])
  })
  it('is empty for nothing, and survives malformed JSON', () => {
    expect(parseComments('')).toEqual([])
    expect(parseComments(undefined)).toEqual([])
    expect(parseComments('[{broken')).toEqual([{ text: '[{broken', ts: 0 }])
  })
})

describe('appendComment', () => {
  it('adds to an existing thread', () => {
    const out = JSON.parse(appendComment('[{"text":"first","ts":1}]', 'second'))
    expect(out.map(c => c.text)).toEqual(['first', 'second'])
    expect(out[1].ts).toBeGreaterThan(0)
  })
  it('starts a thread from an empty note', () => {
    expect(JSON.parse(appendComment('', 'hello')).map(c => c.text)).toEqual(['hello'])
  })
  it('converts a legacy note into a thread, keeping the original', () => {
    expect(JSON.parse(appendComment('old note', 'new')).map(c => c.text)).toEqual(['old note', 'new'])
  })
  it('blank text is a no-op', () => {
    expect(appendComment('[{"text":"a","ts":1}]', '   ')).toBe('[{"text":"a","ts":1}]')
  })
})
