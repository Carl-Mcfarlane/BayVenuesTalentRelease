import { useRef, useState, type ReactNode } from 'react'

/**
 * Must be pressed and held, so talent don't open staff controls by accident.
 * Not a security feature (no passwords). Enter/Space also work for keyboards.
 */
export default function HoldButton({
  onHold, children, ms = 1500,
}: {
  onHold: () => void
  children: ReactNode
  ms?: number
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [holding, setHolding] = useState(false)

  const start = () => {
    setHolding(true)
    timer.current = setTimeout(() => { setHolding(false); onHold() }, ms)
  }
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHold() } }}
      style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      className="relative h-12 overflow-hidden rounded-lg px-4 text-base text-slate-600 underline"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-bv-light/30"
        style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${ms}ms linear` : 'none' }}
      />
      <span className="relative">{children}</span>
    </button>
  )
}
