import { useState } from 'react'
import { fieldsFor } from '../formSchema'
import { validate, type Errors, type Values } from '../lib/validate'
import { focusField } from '../lib/focusField'
import Field from './Field'
import Logo from './Logo'

export default function ShootDetails({
  initial, onDone, error,
}: {
  initial: Values
  onDone: (v: Values) => void | Promise<void>
  error?: string
}) {
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Errors>({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate('staff', values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      focusField(Object.keys(errs)[0])
      return
    }
    onDone(values)
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-xl space-y-5 p-4 pb-10">
      <header>
        <Logo />
        <h1 tabIndex={-1} className="border-b border-bv-blue pb-2 text-2xl font-black text-slate-700 outline-none">Shoot details</h1>
        <p className="text-slate-600">
          Fill these in once, then hand the device to the talent. All fields are required.
        </p>
      </header>
      {fieldsFor('staff').map((f) => (
        <Field
          key={f.key}
          field={f}
          value={values[f.key] ?? ''}
          error={errors[f.key]}
          onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
        />
      ))}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-base text-red-800">{error}</p>
      )}
      <button
        type="submit"
        className="h-16 w-full rounded-xl bg-bv-blue text-lg font-bold text-white active:bg-bv-navy"
      >
        Hand to talent
      </button>
      <p className="text-center text-sm font-semibold uppercase tracking-wide text-bv-blue">
        Photographer to complete
      </p>
    </form>
  )
}