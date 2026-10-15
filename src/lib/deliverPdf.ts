/**
 * The ONLY place a finished PDF leaves the app.
 *
 * Current delivery: the device's share sheet (Save to Files, AirDrop, Mail...)
 * where the browser supports sharing files, otherwise a plain browser
 * download. To change delivery later (SharePoint upload, email, etc.) replace
 * the body of this function and keep the signature. Nothing else in the app
 * should know how delivery works.
 *
 * It never throws: callers get a result. Only `ok: true` means it is safe to
 * delete the local copy of the data.
 */
export type DeliveryResult =
  | { ok: true; method: 'shared' | 'downloaded' }
  | { ok: false; reason: 'dismissed' | 'failed' }

export async function deliverPdf(pdfBytes: Uint8Array, fileName: string): Promise<DeliveryResult> {
  let file: File
  try {
    file = new File([pdfBytes as BlobPart], fileName, { type: 'application/pdf' })
  } catch {
    return { ok: false, reason: 'failed' }
  }

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return { ok: true, method: 'shared' }
    } catch (e) {
      // Dismissed by the user: not delivered.
      if (e instanceof DOMException && e.name === 'AbortError') return { ok: false, reason: 'dismissed' }
      // Anything else (e.g. the tap's permission expired): fall back to a download.
    }
  }

  try {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return { ok: true, method: 'downloaded' }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}
