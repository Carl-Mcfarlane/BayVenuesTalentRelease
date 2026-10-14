/**
 * The ONLY place a finished PDF leaves the app.
 *
 * Current delivery: browser download. To change delivery later (SharePoint
 * upload, email, etc.) replace the body of this function and keep the
 * signature. Nothing else in the app should know how delivery works.
 */
export async function deliverPdf(pdfBytes: Uint8Array, fileName: string): Promise<void> {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}