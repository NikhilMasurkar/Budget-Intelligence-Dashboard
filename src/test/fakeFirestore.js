// In-memory stand-in for the parts of firebase/firestore the data layer uses.
// Enough to exercise real read/merge/delete semantics in tests:
//   vi.mock('firebase/firestore', () => fakeFirestore)
export const docs = new Map()          // full path → data
export let writes = 0                  // documents written by committed batches

export function reset() { docs.clear(); writes = 0 }

const clone = (v) => JSON.parse(JSON.stringify(v))
const DELETE = Symbol('deleteField')

export class FieldPath { constructor(...segments) { this.segments = segments } }
export const deleteField = () => DELETE
export const doc = (_db, ...seg) => ({ path: seg.join('/'), id: seg[seg.length - 1] })
export const collection = (_db, ...seg) => ({ path: seg.join('/') })
export const query = (c) => c
export const orderBy = () => null

function snapshotOf(col) {
  const depth = col.path.split('/').length + 1
  return {
    docs: [...docs.entries()]
      .filter(([p]) => p.startsWith(col.path + '/') && p.split('/').length === depth)
      .map(([p, d]) => ({ id: p.split('/').pop(), ref: { path: p }, data: () => clone(d) })),
  }
}
export const getDocs = async (col) => snapshotOf(col)
export const getDocsFromServer = getDocs
export const getDocsFromCache = getDocs
export const getDoc = async (ref) => ({ exists: () => docs.has(ref.path), data: () => clone(docs.get(ref.path)) })

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') deepMerge(target[k], v)
    else target[k] = clone(v)
  }
  return target
}
export const setDoc = async (ref, data, opts) => {
  docs.set(ref.path, opts?.merge ? deepMerge(docs.get(ref.path) || {}, data) : clone(data))
}

export function writeBatch() {
  const ops = []
  return {
    set: (ref, data, opts) => ops.push(() => setDoc(ref, data, opts)),
    delete: (ref) => ops.push(() => docs.delete(ref.path)),
    update: (ref, field, value) => ops.push(() => {
      if (!docs.has(ref.path)) throw new Error(`No document to update: ${ref.path}`)
      const d = docs.get(ref.path)
      const seg = field.segments
      let o = d
      seg.slice(0, -1).forEach(k => { o = o[k] = o[k] || {} })
      if (value === DELETE) delete o[seg[seg.length - 1]]
      else o[seg[seg.length - 1]] = value
    }),
    commit: async () => { for (const op of ops) await op(); writes += ops.length },
  }
}
