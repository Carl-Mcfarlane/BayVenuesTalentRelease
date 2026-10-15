import { useEffect, useState } from 'react'
import ShootDetails from './components/ShootDetails'
import StaffPanel from './components/StaffPanel'
import TalentForm, { type TalentSubmission } from './components/TalentForm'
import {
  addEntry, getBatch, purgeIfStale, requestPersistence, startBatch, updateShoot,
} from './lib/batchStore'
import { loadAssets } from './lib/loadAssets'
import { todayISO, type Values } from './lib/validate'

type Screen = 'loading' | 'shoot' | 'talent' | 'staff'

// Completed forms are stored only on this device (IndexedDB, see batchStore)
// until staff finish the shoot. Half-filled forms are never stored.
export default function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [shoot, setShoot] = useState<Values>({ date: todayISO() })
  const [hasBatch, setHasBatch] = useState(false)
  const [shootError, setShootError] = useState('')
  // Bumping this remounts TalentForm, which throws away everything the last
  // talent entered and gives the next talent a blank form.
  const [formKey, setFormKey] = useState(0)
  const [saved, setSaved] = useState(false)

  // On load: drop a stale batch (24h with no new signature), then pick up an
  // unfinished shoot so nobody has to sign again after a reload or lock.
  useEffect(() => {
    requestPersistence()
    void (async () => {
      try {
        await purgeIfStale()
        const batch = await getBatch()
        if (batch) {
          setShoot(batch.shoot)
          setHasBatch(true)
          setScreen('talent')
          return
        }
      } catch {
        // Storage unavailable: the shoot screen will explain if saving fails.
      }
      setScreen('shoot')
    })()
  }, [])

  // Warm up the PDF code and static assets (blank form, font) so finishing
  // works even if the signal drops later. No personal data.
  useEffect(() => {
    void import('./lib/generatePdf')
    loadAssets().catch(() => {})
  }, [])

  // New screen: start at the top and move focus to its heading.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [screen, formKey])

  // Brief confirmation for staff after a form is saved. Shows no personal details.
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 6000)
    return () => clearTimeout(t)
  }, [saved])

  const handleShootDone = async (v: Values) => {
    setShootError('')
    try {
      if (hasBatch) await updateShoot(v)
      else await startBatch(v)
    } catch {
      setShootError("This browser can't save forms on this device, so signing can't start. Try Safari (not private browsing).")
      return
    }
    setShoot(v)
    setHasBatch(true)
    setSaved(false)
    setScreen('talent')
  }

  // Saves the completed form to this device. Resolves (so the form resets and
  // "Form saved" shows) only once the write has been committed; if it throws,
  // TalentForm keeps what was typed so the person can retry.
  const handleSubmit = async ({ values, signaturePng }: TalentSubmission) => {
    await addEntry({ id: crypto.randomUUID(), submittedAt: Date.now(), values, signaturePng })
    setFormKey((k) => k + 1)
    setSaved(true)
  }

  const startNewShoot = () => {
    setShoot({ date: todayISO() })
    setHasBatch(false)
    setSaved(false)
    setScreen('shoot')
  }

  return (
    <main className="min-h-dvh bg-white text-slate-900">
      {saved && screen === 'talent' && (
        <div role="status" className="bg-bv-green px-4 py-3 text-center text-base font-bold text-white">
          Form saved. Ready for the next person.
        </div>
      )}
      {screen === 'shoot' && <ShootDetails initial={shoot} onDone={handleShootDone} error={shootError} />}
      {screen === 'talent' && (
        <TalentForm key={formKey} onSubmit={handleSubmit} onStaff={() => setScreen('staff')} />
      )}
      {screen === 'staff' && (
        <StaffPanel
          shoot={shoot}
          onBack={() => { setFormKey((k) => k + 1); setScreen('talent') }}
          onChangeShoot={() => setScreen('shoot')}
          onFinished={startNewShoot}
        />
      )}
    </main>
  )
}
