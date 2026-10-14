/**
 * The ONLY place a finished PDF leaves the app.
 *
 * Current delivery: the device's share sheet (Save to Files, AirDrop, Mail,
 * Print...) where the browser supports sharing files, otherwise a plain
 * browser download. To change delivery later (SharePoint upload, email, etc.)
 * replace the body of this function and keep the signature. Nothing else in
 * the app should know how delivery works.
 *
 * Throws if the PDF was not delivered (e.g. the share sheet was dismissed), so
 * the caller keeps the form open and the person can try again.
 */
export async function deliverPdf(pdfBytes: Uint8Array, fileName: string): Promise<void> {
  const file = new File([pdfBytes as BlobPart], fileName, { type: 'application/pdf' })

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      // Dismissed by the user: not delivered, so don't carry on to "thank you".
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      // Anything else (e.g. the tap's permission expired while the PDF was
      // being built): fall back to a normal download.
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
