import type { Values } from './validate'

/**
 * Completed submissions for the current shoot, kept ONLY on this device in
 * IndexedDB (never localStorage, never sent anywhere). Half-filled forms are
 * never stored. The whole batch is deleted once the combined PDF is saved, or
 * after 24 hours with no new signature.
 */

export type Entry = {
  id: string
  submittedAt: number // ms since epoch
  values: Values // fullName, email, phone, under18, guardianName
  signaturePng: string // trimmed PNG data URL
}

export type Batch = {
  shoot: Values // photographer, reason, date (YYYY-MM-DD), venue
  startedAt: number
  lastActivityAt: number
}

export const MAX_AGE_MS = 24 * 60 * 60 * 1000

const DB = 'talent-release-forms'
const BATCH = 'batch'
const ENTRIES = 'entries'
const KEY = 'current'

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => {
      r.result.createObjectStore(BATCH)
      r.result.createObjectStore(ENTRIES, { keyPath: 'id' })
    }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.onblocked = () => reject(new Error('IndexedDB blocked'))
  })

const wrap = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })

/** Runs fn inside one transaction and resolves when it has committed. */
async function tx<T>(
  mode: IDBTransactionMode,
  fn: (batch: IDBObjectStore, entries: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await open()
  try {
    const t = db.transaction([BATCH, ENTRIES], mode)
    const committed = new Promise<void>((resolve, reject) => {
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error ?? new Error('Transaction aborted'))
    })
    const result = await fn(t.objectStore(BATCH), t.objectStore(ENTRIES))
    await committed
    return result
  } finally {
    db.close()
  }
}

export const getBatch = () =>
  tx('readonly', async (b) => ((await wrap(b.get(KEY))) as Batch | undefined) ?? null)

/** Starts a fresh batch, replacing anything already stored. */
export const startBatch = (shoot: Values) =>
  tx('readwrite', async (b, e) => {
    e.clear()
    const now = Date.now()
    b.put({ shoot, startedAt: now, lastActivityAt: now } satisfies Batch, KEY)
  })

/** Corrects the shoot details but keeps the signed entries. */
export const updateShoot = (shoot: Values) =>
  tx('readwrite', async (b) => {
    const cur = (await wrap(b.get(KEY))) as Batch | undefined
    if (!cur) throw new Error('No current batch')
    b.put({ ...cur, shoot } satisfies Batch, KEY)
  })

/** Saves one completed submission. Resolves only once it is committed to disk. */
export const addEntry = (entry: Entry) =>
  tx('readwrite', async (b, e) => {
    const cur = (await wrap(b.get(KEY))) as Batch | undefined
    if (!cur) throw new Error('No current batch')
    e.put(entry)
    b.put({ ...cur, lastActivityAt: Date.now() } satisfies Batch, KEY)
  })

export const countEntries = () => tx('readonly', (_b, e) => wrap(e.count()))

/** Entries in the order they were signed. */
export const listEntries = () =>
  tx('readonly', async (_b, e) => {
    const all = (await wrap(e.getAll())) as Entry[]
    return all.sort((x, y) => x.submittedAt - y.submittedAt)
  })

export const deleteBatch = () =>
  tx('readwrite', async (b, e) => {
    b.clear()
    e.clear()
  })

/** Deletes the batch if nothing has been signed for MAX_AGE_MS. Returns true if it did. */
export async function purgeIfStale(now = Date.now()): Promise<boolean> {
  const batch = await getBatch()
  if (!batch || now - batch.lastActivityAt <= MAX_AGE_MS) return false
  await deleteBatch()
  return true
}

/** Asks the browser not to evict our data under storage pressure. Best effort. */
export const requestPersistence = () => {
  void navigator.storage?.persist?.().catch(() => {})
}
