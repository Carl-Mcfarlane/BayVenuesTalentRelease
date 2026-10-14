import type { PdfAssets } from './generatePdf'

const get = async (name: string) => {
  const res = await fetch(`${import.meta.env.BASE_URL}${name}`)
  if (!res.ok) throw new Error(`Could not load ${name}`)
  return new Uint8Array(await res.arrayBuffer())
}

let cached: Promise<PdfAssets> | null = null

/** Static files only (no personal data). Fetched once, then reused. */
export function loadAssets(): Promise<PdfAssets> {
  cached ??= Promise.all([get('talent-release-form.pdf'), get('fonts/NotoSans-Regular.ttf')])
    .then(([templateBytes, fontBytes]) => ({ templateBytes, fontBytes }))
    .catch((e) => { cached = null; throw e })
  return cached
}