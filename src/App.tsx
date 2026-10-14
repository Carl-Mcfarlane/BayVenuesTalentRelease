import { useEffect, useState } from 'react'
import Logo from './components/Logo'
import ShootDetails from './components/ShootDetails'
import TalentForm, { type TalentSubmission } from './components/TalentForm'
import { deliverPdf } from './lib/deliverPdf'
import { loadAssets } from './lib/loadAssets'
import { todayISO, type Values } from './lib/validate'

type Screen = 'shoot' | 'talent' | 'thanks'

// Shoot details are kept in React state only (never localStorage), so they
// survive between talent but vanish on reload.
export default function App() {
  const [screen, setScreen] = useState<Screen>('shoot')
  const [shoot, setShoot] = useState<Values>({ date: todayISO() })

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
  }, [screen])

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
    setScreen('thanks')
  }
  return (
    <main className="min-h-dvh bg-white text-slate-900">
      {screen === 'shoot' && (
        <ShootDetails
          initial={shoot}
          onDone={(v) => { setShoot(v); setScreen('talent') }}
        />
      )}
      {screen === 'talent' && <TalentForm onSubmit={handleSubmit} />}
      {screen === 'thanks' && (
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6 text-center">
          <Logo />
          <h1 tabIndex={-1} className="text-3xl font-black text-bv-blue outline-none">Thank you!</h1>
          <p className="text-lg text-slate-700">Your form has been completed. Please hand the device back to Bay Venues staff.</p>
          <button
            onClick={() => setScreen('talent')}
            className="mt-4 h-16 rounded-xl bg-bv-blue text-lg font-bold text-white active:bg-bv-navy"
          >
            Next person
          </button>
          <button
            onClick={() => setScreen('shoot')}
            className="h-12 text-base text-slate-600 underline"
          >
            Change shoot details
          </button>
        </div>
      )}
    </main>
  )
}