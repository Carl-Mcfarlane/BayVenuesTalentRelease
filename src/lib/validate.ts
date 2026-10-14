import { fieldsFor, type FormField } from '../formSchema'

export type Values = Record<string, string>
export type Errors = Record<string, string>

export const todayISO = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Label to show, switching wording when the talent is under 18. */
export const labelFor = (f: FormField, values: Values) =>
  values.under18 === 'yes' && f.labelIfUnder18 ? f.labelIfUnder18 : f.label

export const isVisible = (f: FormField, values: Values) =>
  !f.showIf || values[f.showIf.key] === f.showIf.equals

/** Validates the typed fields for one side of the form (signature is checked by the pad). */
export function validate(who: 'staff' | 'talent', values: Values): Errors {
  const errors: Errors = {}
  for (const f of fieldsFor(who)) {
    if (f.auto || f.type === 'signature' || !isVisible(f, values)) continue
    const v = (values[f.key] ?? '').trim()
    if (f.required && !v) {
      errors[f.key] = f.type === 'yesno' ? 'Please choose Yes or No' : `${labelFor(f, values)} is required`
    } else if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors[f.key] = 'Enter a valid email address'
    } else if (f.type === 'tel' && v && v.replace(/\D/g, '').length < 7) {
      errors[f.key] = 'Enter a valid phone number'
    }
  }
  return errors
}