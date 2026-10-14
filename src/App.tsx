import { useEffect, useState } from 'react'
import ShootDetails from './components/ShootDetails'
import TalentForm, { type TalentSubmission } from './components/TalentForm'
import { deliverPdf } from './lib/deliverPdf'
import { loadAssets } from './lib/loadAssets'
import { todayISO, type Values } from './lib/validate'

type Screen = 'shoot' | 'talent'

// Shoot details are kept in React state only (never localStorage), so they
// survive between talent but vanish on reload.
export default function App() {
  const [screen, setScreen] = useState<Screen>('shoot')
  const [shoot, setShoot] = useState<Values>({ date: todayISO() })
  // Bumping this remounts TalentForm, which throws away everything the last
  // talent entered and gives the next talent a blank form.
  const [formKey, setFormKey] = useState(0)
  const [saved, setSaved] = useState(false)

  // Warm up the PDF code and static assets (blank form, font) while staff type,
  // so submit still works if the venue's connection drops later. No personal data.
  useEffect(() => {
    void import('./lib/generatePdf')
    loadAssets().catch(() => {})
  }, [])

  // New screen: start at the top and move focus to its heading (the previous
  // form may have been scrolled to the bottom; helps screen readers too).
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

  // Builds the signed PDF in the browser and hands it to deliverPdf. Nothing
  // from the talent is kept: once this resolves, TalentForm is unmounted.
  const handleSubmit = async ({ values, signaturePng }: TalentSubmission) => {
    const png = Uint8Array.from(atob(signaturePng.split(',')[1]), (c) => c.charCodeAt(0))
    const signedAt = new Date()
    const { generatePdf, pdfFileName } = await import('./lib/generatePdf')
    const bytes = await generatePdf(
      { shoot, talent: values, signaturePng: png, signedAt },
      await loadAssets(),
    )
    await deliverPdf(bytes, pdfFileName(shoot.date, values.fullName, shoot.reason))
    // Straight back to a blank form for the next talent, same shoot details.
    setFormKey((k) => k + 1)
    setSaved(true)
  }

  return (
    <main className="min-h-dvh bg-white text-slate-900">
      {saved && screen === 'talent' && (
        <div role="status" className="bg-bv-green px-4 py-3 text-center text-base font-bold text-white">
          Form saved. Ready for the next person.
        </div>
      )}
      {screen === 'shoot' && (
        <ShootDetails
          initial={shoot}
          onDone={(v) => { setShoot(v); setSaved(false); setScreen('talent') }}
        />
      )}
      {screen === 'talent' && (
        <TalentForm
          key={formKey}
          onSubmit={handleSubmit}
          onChangeShoot={() => setScreen('shoot')}
        />
      )}
    </main>
  )
}
