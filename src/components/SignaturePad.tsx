import { useEffect, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export type SignaturePadHandle = { isEmpty: () => boolean; toPng: () => string }

/**
 * `touch-action: none` on the canvas stops the page scrolling or zooming while
 * signing on iPhone/iPad. The canvas is resized to its container (and for
 * device pixel ratio), preserving any strokes already drawn.
 */
export default function SignaturePad({
  padRef, label, error, onStroke,
}: {
  label: string
  padRef: React.MutableRefObject<SignatureCanvas | null>
  error?: string
  onStroke: () => void
}) {
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const resize = () => {
      const pad = padRef.current
      const canvas = pad?.getCanvas()
      if (!pad || !canvas) return
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      if (canvas.width === Math.round(w * ratio) && canvas.height === Math.round(h * ratio)) return
      const data = pad.toData()
      canvas.width = Math.round(w * ratio)
      canvas.height = Math.round(h * ratio)
      canvas.getContext('2d')!.scale(ratio, ratio)
      pad.clear()
      pad.fromData(data)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [padRef])

  return (
    <div data-field="signature">
      <div className="mb-1 flex items-end justify-between">
        <span className="text-base font-semibold text-bv-blue">{label}</span>
        <button
          type="button"
          onClick={() => padRef.current?.clear()}
          className="h-12 rounded-lg border border-bv-light bg-white px-5 text-base font-medium active:bg-slate-100"
        >
          Clear
        </button>
      </div>
      <div
        ref={wrap}
        className={`h-52 w-full rounded-lg border-2 bg-white ${
          error ? 'border-bv-red' : 'border-bv-light'
        }`}
      >
        <SignatureCanvas
          ref={(r) => { padRef.current = r }}
          onEnd={onStroke}
          penColor="#111"
          canvasProps={{
            className: 'block h-full w-full rounded-lg',
            style: {
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            },
            role: 'img',
            'aria-label': 'Signature area. Draw your signature with your finger or a stylus.',
          }}
        />
      </div>
      <p className="mt-1 text-sm text-slate-500">Sign with your finger inside the box.</p>
      {error && <p role="alert" className="mt-1 text-base text-red-700">{error}</p>}
    </div>
  )
}