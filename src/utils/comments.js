// An expense's comment thread is stored in its `note` field as a JSON array of
// { text, ts }. Kept here rather than inside a component because three places
// now read or write it: the comments modal, the expenses list, and the
// add/edit modal (which logs amount changes into the same thread).

/**
 * Read a note into a comment list. Tolerates the legacy format, where the note
 * was a single plain string rather than a JSON array.
 */
export function parseComments(note) {
  if (!note) return []
  const s = String(note).trim()
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed
    } catch { /* not valid JSON — fall through to the legacy path */ }
  }
  if (s) return [{ text: s, ts: 0 }]
  return []
}

/** Append one comment, returning the new note JSON. Blank text is a no-op. */
export function appendComment(note, text) {
  const t = String(text ?? '').trim()
  if (!t) return note ?? ''
  const list = parseComments(note)
  list.push({ text: t, ts: Date.now() })
  return JSON.stringify(list)
}
