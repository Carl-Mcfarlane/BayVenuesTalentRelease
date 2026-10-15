import { useEffect, useState } from 'react'
import { countEntries, deleteBatch, listEntries } from '../lib/batchStore'
import { deliverPdf } from '../lib/deliverPdf'
import { loadAssets } from '../lib/loadAssets'
import type { Values } from '../lib/validate'
import Logo from './Logo'

type Phase =
  | { name: 'idle' }
  | { name: 'building'; done: number; total: number }
  | { name: 'ready'; bytes: Uint8Array; fileName: string; notice?: string }
  | { name: 'confirm'; bytes: Uint8Array; fileName: string }
  | { name: 'error'; message: string }

const btn = 'h-16 w-full rounded-xl text-lg font-bold disabled:opacity-50'
const primary = `${btn} bg-bv-blue text-white active:bg-bv-navy`
const secondary = `${btn} border-2 border-bv-blue bg-white text-bv-blue active:bg-slate-100`

/**
 * Staff-only controls. Shows how many people have signed (never their names).
 * Nothing is deleted until the PDF has been delivered AND staff confirm it saved.
 */
export default function StaffPanel({
  shoot, onBack, onChangeShoot, onFinished,
}: {
  shoot: Values
  onBack: () => void
  onChangeShoot: () => void
  onFinished: () => void // batch deleted; start a new shoot
}) {
  const [count, setCount] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  useEffect(() => {
    countEntries()
      .then(setCount)
      .catch(() => setPhase({ name: 'error', message: "Couldn't read the saved forms on this device." }))
  }, [])

  const busy = phase.name === 'building'

  // Step 1: build the PDF. (Sharing needs a fresh tap, so it is a separate step.)
  const build = async () => {
    setPhase({ name: 'building', done: 0, total: count ?? 0 })
    try {
      const entries = await listEntries()
      if (!entries.length) { setPhase({ name: 'idle' }); return }
      const { generateCombinedPdf, batchFileName } = await import('../lib/generatePdf')
      const bytes = await generateCombinedPdf(shoot, entries, await loadAssets(), (done, total) =>
        setPhase({ name: 'building', done, total }),
      )
      setPhase({ name: 'ready', bytes, fileName: batchFileName(shoot.date, shoot.reason, entries.length) })
    } catch (e) {
      const known = e instanceof Error && e.message.startsWith('Could not build')
      setPhase({
        name: 'error',
        message: known
          ? `${(e as Error).message}. Nothing has been deleted.`
          : "Couldn't build the PDF. Nothing has been deleted.",
      })
    }
  }

  // Step 2: hand it to deliverPdf straight from the tap.
  const save = async (bytes: Uint8Array, fileName: string) => {
    const result = await deliverPdf(bytes, fileName)
    if (result.ok) setPhase({ name: 'confirm', bytes, fileName })
    else setPhase({ name: 'ready', bytes, fileName, notice: 'Not saved yet. Tap Save PDF to try again.' })
  }

  const clear = async () => {
    try {
      await deleteBatch()
      onFinished()
    } catch {
      setPhase({ name: 'error', message: "Couldn't clear the saved forms. They are still on this device." })
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 p-4 pb-10">
      <header>
        <Logo />
        <h1 tabIndex={-1} className="border-b border-bv-blue pb-2 text-2xl font-black text-slate-700 outline-none">
          Staff
        </h1>
        <p className="mt-2 text-slate-600">{shoot.reason} · {shoot.venue} · {shoot.date}</p>
      </header>

      <p className="text-3xl font-black text-bv-blue" aria-live="polite">
        {count === null ? '…' : `${count} ${count === 1 ? 'person' : 'people'} signed`}
      </p>

      {phase.name === 'error' && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-base text-red-800">{phase.message}</p>
      )}

      {(phase.name === 'idle' || phase.name === 'error') && (
        <button className={primary} disabled={!count} onClick={build}>Finish shoot and save PDF</button>
      )}

      {phase.name === 'building' && (
        <p role="status" className="rounded-lg bg-slate-100 p-4 text-center text-lg">
          Building PDF… {phase.done} of {phase.total}
        </p>
      )}

      {phase.name === 'ready' && (
        <div className="space-y-3">
          <p role="status" className="text-base text-slate-700">
            PDF ready ({count} {count === 1 ? 'form' : 'forms'}).{phase.notice ? ` ${phase.notice}` : ''}
          </p>
          <button className={primary} onClick={() => save(phase.bytes, phase.fileName)}>Save PDF</button>
        </div>
      )}

      {phase.name === 'confirm' && (
        <div className="space-y-3 rounded-lg border-2 border-bv-green p-4">
          <p className="text-lg font-bold">Did the PDF save?</p>
          <p className="text-base text-slate-700">Check it is in Files (or wherever you sent it) before clearing.</p>
          <button className={primary} onClick={clear}>Yes, clear signatures from this phone</button>
          <button
            className={secondary}
            onClick={() => setPhase({ name: 'ready', bytes: phase.bytes, fileName: phase.fileName })}
          >
            No, keep them
          </button>
        </div>
      )}

      <div className="space-y-3 border-t border-bv-light pt-5">
        <button className={secondary} disabled={busy} onClick={onBack}>Back to signing</button>
        <button className={secondary} disabled={busy} onClick={onChangeShoot}>Change shoot details</button>
        {!confirmDiscard ? (
          <button
            className="h-12 w-full text-base text-slate-600 underline disabled:opacity-50"
            disabled={busy}
            onClick={() => setConfirmDiscard(true)}
          >
            Discard this shoot
          </button>
        ) : (
          <div role="alert" className="space-y-3 rounded-lg border-2 border-bv-red p-4">
            <p className="text-base font-bold">Delete every signed form on this phone? This can't be undone.</p>
            <button className={`${btn} bg-bv-red text-white`} onClick={clear}>Yes, delete everything</button>
            <button className={secondary} onClick={() => setConfirmDiscard(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
