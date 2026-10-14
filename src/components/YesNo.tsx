import type { FormField } from '../formSchema'

/** Native radio buttons (keyboard + screen reader friendly), styled as big buttons. */
export default function YesNo({
  field, value, error, onChange,
}: {
  field: FormField
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset data-field={field.key} aria-describedby={error ? `${field.key}-err` : undefined}>
      <legend className="mb-1 text-base font-semibold text-bv-blue">{field.label}</legend>
      <div className="grid grid-cols-2 gap-3">
        {(['yes', 'no'] as const).map((opt) => (
          <label key={opt} className="relative block">
            <input
              type="radio"
              name={field.key}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="peer sr-only"
            />
            <span
              className={`flex h-14 items-center justify-center rounded-lg border-2 text-lg font-semibold peer-checked:border-bv-blue peer-checked:bg-bv-blue peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-bv-blue peer-focus-visible:ring-offset-2 ${
                error ? 'border-bv-red bg-white' : 'border-bv-light bg-white'
              }`}
            >
              {opt === 'yes' ? 'Yes' : 'No'}
            </span>
          </label>
        ))}
      </div>
      {error && <p id={`${field.key}-err`} role="alert" className="mt-1 text-base text-red-700">{error}</p>}
    </fieldset>
  )
}
