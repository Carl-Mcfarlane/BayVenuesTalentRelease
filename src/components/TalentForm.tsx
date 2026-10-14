import { useEffect, useRef, useState } from 'react'
import type SignatureCanvas from 'react-signature-canvas'
import {
  ageParagraphAdult, ageParagraphMinor, consentParagraphs, consentTitle, fieldsFor,
} from '../formSchema'
import { focusField } from '../lib/focusField'
import { trimmedSignaturePng } from '../lib/trimSignature'
import { isVisible, labelFor, validate, type Errors, type Values } from '../lib/validate'
import Field from './Field'
import Logo from './Logo'
import SignaturePad from './SignaturePad'
import YesNo from './YesNo'

/** Rejects an empty pad or a stray tap: needs a stroke at least ~30px across. */
function hasRealSignature(pad: SignatureCanvas | null) {
  if (!pad || pad.isEmpty()) return false
  const pts = pad.toData().flat()
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) >= 30
}

export type TalentSubmission = { values: Values; signaturePng: string }

/**
 * All talent data lives in this component's state. When the parent unmounts it
 * (after submit) everything is discarded.
 */
export default function TalentForm({
  onSubmit,
}: {
  onSubmit: (s: TalentSubmission) => Promise<void>
}) {
  const [values, setValues] = useState<Values>({})
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const pad = useRef<SignatureCanvas | null>(null)

  const set = (key: string, v: string) => setValues((s) => ({ ...s, [key]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    const errs = validate('talent', values)
    if (!hasRealSignature(pad.current)) errs.signature = 'Please sign in the box'
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      focusField(first)
      return
    }
    setBusy(true)
    setFailed(false)
    try {
      await onSubmit({ values, signaturePng: trimmedSignaturePng(pad.current!.getCanvas()) })
    } catch {
      // Deliberately no logging: the error context could include personal data.
      setFailed(true)
      setBusy(false)
    }
  }

  const answered = values.under18 === 'yes' || values.under18 === 'no'
  const under18 = values.under18 === 'yes'

  // Changing the answer changes the wording being signed, so start the signature again.
  useEffect(() => { pad.current?.clear() }, [under18])
  const inputs = fieldsFor('talent').filter(
    (f) => !f.auto && f.type !== 'signature' && isVisible(f, values),
  )

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-xl space-y-5 p-4 pb-10">
      <header>
        <Logo />
        <h1 tabIndex={-1} className="border-b border-bv-blue pb-2 text-center text-2xl font-black text-slate-700 outline-none">Talent Release Form</h1>
        <p className="mt-1 text-center text-slate-600">All fields are required. Start by answering the first question.</p>
      </header>
      {inputs.map((f) => {
        const ask = f.type === 'yesno'
        if (!ask && !answered) return null
        return ask ? (
          <YesNo key={f.key} field={f} value={values[f.key] ?? ''} error={errors[f.key]}
            onChange={(v) => set(f.key, v)} />
        ) : (
          <Field key={f.key} field={f} label={labelFor(f, values)} value={values[f.key] ?? ''}
            error={errors[f.key]} onChange={(v) => set(f.key, v)} />
        )
      })}

      {answered && (
        <>
          <section className="space-y-3 rounded-lg border border-bv-light bg-white p-4">
            <h2 className="text-lg font-bold uppercase">{consentTitle}</h2>
            {[...consentParagraphs, under18 ? ageParagraphMinor : ageParagraphAdult].map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-bv-blue">{p}</p>
            ))}
          </section>

          <SignaturePad
            padRef={pad}
            label={under18 ? 'Parent / guardian signature' : 'Signature'}
            error={errors.signature}
            onStroke={() => setErrors((e) => ({ ...e, signature: '' }))}
          />
        </>
      )}

      {failed && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-base text-red-800">
          The form hasn't been saved yet. If the share sheet was closed, tap submit again. Otherwise please ask Bay Venues staff.
        </p>
      )}
      {answered && <button
        type="submit"
        disabled={busy}
        className="h-16 w-full rounded-xl bg-bv-blue text-lg font-bold text-white active:bg-bv-navy disabled:opacity-60"
      >
        {busy ? 'Preparing your form…' : 'I agree and submit'}
      </button>}
    </form>
  )
}