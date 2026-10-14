import type { FormField } from '../formSchema'

// Autofill is switched off: on a shared device it could offer the previous
// person's (or the device owner's) details to the next talent.
const CAPS: Record<string, 'words' | 'sentences' | 'none'> = {
  fullName: 'words', guardianName: 'words', photographer: 'words',
  reason: 'sentences', venue: 'words', email: 'none', phone: 'none',
}

export default function Field({
  field, label, value, error, onChange,
}: {
  field: FormField
  label?: string
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  const id = `f-${field.key}`
  const isText = field.type !== 'date'
  const isDate = field.type === 'date'
  const [y, m, d] = value.split('-').map(Number)
  const shown = value
    ? new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d))
    : 'Choose a date'
  return (
    <div data-field={field.key}>
      <label htmlFor={id} className="mb-1 block text-base font-semibold text-bv-blue">
        {label ?? field.label}
      </label>
      <div className={isDate ? `relative flex h-14 items-center rounded-lg border bg-white px-4 text-base focus-within:ring-2 focus-within:ring-bv-blue ${error ? 'border-bv-red' : 'border-bv-light'}` : undefined}>
      {isDate && <span aria-hidden="true" className={value ? 'text-slate-900' : 'text-slate-500'}>{shown}</span>}
      <input
        id={id}
        type={field.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        maxLength={120}
        autoCapitalize={isText ? CAPS[field.key] ?? 'sentences' : undefined}
        autoCorrect="off"
        spellCheck={false}
        inputMode={field.type === 'tel' ? 'tel' : undefined}
        enterKeyHint="next"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={
          isDate
            // iOS Safari lays out native date inputs its own way (and ignores
            // vertical centring), so the native input is invisible and
            // stretched over a normal text display of the chosen date.
            ? 'absolute inset-0 h-full w-full cursor-pointer opacity-0'
            : `block h-14 w-full min-w-0 rounded-lg border bg-white px-4 text-left text-base outline-none focus:ring-2 focus:ring-bv-blue ${
                error ? 'border-bv-red' : 'border-bv-light'
              }`
        }
      />
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-base text-red-700">{error}</p>
      )}
    </div>
  )
}
