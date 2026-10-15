import { PDFDocument, rgb, type PDFEmbeddedPage, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { ageParagraphMinor, ageParagraphPdf, fields } from '../formSchema'
import type { Entry } from './batchStore'
import type { Values } from './validate'

export type PdfAssets = {
  templateBytes: Uint8Array // the original flat PDF
  fontBytes: Uint8Array // a TTF with Latin Extended (macrons etc.)
}

const INK = rgb(0.137, 0.122, 0.125) // matches the original's text/line colour

const pos = (key: string) => {
  const p = fields.find((f) => f.key === key)?.pdf
  if (!p) throw new Error(`No PDF position for ${key}`)
  return p
}

/** Last resort for absurdly long input: cut with an ellipsis rather than overrun the page. */
function ellipsize(font: PDFFont, text: string, size: number, maxW: number) {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

/** Draws text sitting just above a ruled line, shrinking to fit the line. */
function onLine(page: PDFPage, font: PDFFont, text: string, key: string, size = 11) {
  const { x, xEnd, y } = pos(key)
  const maxW = xEnd - x - 4
  let s = size
  while (s > 7 && font.widthOfTextAtSize(text, s) > maxW) s -= 0.5
  text = ellipsize(font, text, s, maxW)
  page.drawText(text, { x: x + 2, y: y + 3, size: s, font, color: INK })
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)

const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d)

/** YYYY-MM-DD -> local Date (avoids UTC shifting the day). */
const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Draws one person's answers onto a page that already carries the blank form. */
async function drawEntry(doc: PDFDocument, page: PDFPage, font: PDFFont, shoot: Values, entry: Entry) {
  const talent = entry.values
  const signedAt = new Date(entry.submittedAt)
  const under18 = talent.under18 === 'yes'

  onLine(page, font, talent.fullName.trim(), 'fullName')
  onLine(page, font, talent.email.trim(), 'email')
  onLine(page, font, talent.phone.trim(), 'phone')

  onLine(page, font, shoot.photographer.trim(), 'photographer')
  // The original has no venue line, so venue is appended to the description.
  const description = [shoot.reason.trim(), shoot.venue?.trim()].filter(Boolean).join(' – ')
  onLine(page, font, description, 'reason')
  onLine(page, font, fmtDate(parseISO(shoot.date)), 'date')

  if (under18) {
    // Cover the printed "I am over 18..." line and replace it with guardian wording.
    const a = ageParagraphPdf
    page.drawRectangle({ x: a.x, y: a.y, width: a.width, height: a.height, color: rgb(1, 1, 1) })
    const size = 10.5
    const lines: string[] = []
    let line = ''
    for (const word of ageParagraphMinor.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(next, size) > 485 && line) { lines.push(line); line = word } else line = next
    }
    lines.push(line)
    lines.forEach((l, i) =>
      page.drawText(l, { x: 55, y: a.y + a.height - 10 - i * 11, size, font, color: INK }))

    // Guardian name, printed just below the consent box.
    const g = pos('guardianName')
    const label = 'Parent / guardian name:'
    page.drawText(label, { x: 56, y: g.y, size: 10, font, color: INK })
    page.drawText(
      "Name above is the talent's (under 18). Contact details above are the parent / guardian's.",
      { x: 56, y: g.y - 11, size: 8, font, color: INK },
    )
    const gx = 56 + font.widthOfTextAtSize(label, 10) + 5
    page.drawText(ellipsize(font, talent.guardianName.trim(), 10, g.xEnd - gx), {
      x: gx, y: g.y, size: 10, font, color: INK,
    })
  }

  // Signature, scaled to fit above its line.
  const sig = pos('signature')
  const img = await doc.embedPng(entry.signaturePng)
  const maxW = sig.xEnd - sig.x - 6
  const maxH = 26
  const scale = Math.min(maxW / img.width, maxH / img.height)
  const w = img.width * scale
  const h = img.height * scale
  page.drawImage(img, { x: sig.x + 3 + (maxW - w) / 2, y: sig.y - 1, width: w, height: h })

  // Signed date on the line, time directly beneath it.
  const sd = pos('signedDate')
  const dateText = fmtDate(signedAt)
  page.drawText(dateText, { x: sd.x + 2, y: sd.y + 3, size: 10, font, color: INK })
  page.drawText(fmtTime(signedAt), { x: sd.x + 2, y: sd.y - 9, size: 8, font, color: INK })
}

/**
 * One PDF containing a copy of the original form per signer, in signing order.
 * The blank form and the font are embedded once, then reused for every page, so
 * the file stays small and memory stays low even for dozens of signers.
 */
export async function generateCombinedPdf(
  shoot: Values,
  entries: Entry[],
  assets: PdfAssets,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(assets.fontBytes, { subset: false })
  const [form]: PDFEmbeddedPage[] = await doc.embedPdf(assets.templateBytes, [0])

  for (let i = 0; i < entries.length; i++) {
    const page = doc.addPage([form.width, form.height])
    page.drawPage(form)
    try {
      await drawEntry(doc, page, font, shoot, entries[i])
    } catch {
      // No details in the message: it is shown to staff and must not leak personal data.
      throw new Error(`Could not build form ${i + 1} of ${entries.length}`)
    }
    onProgress?.(i + 1, entries.length)
    await new Promise((r) => setTimeout(r)) // let the screen update on slower phones
  }

  doc.setTitle('Talent Release Forms')
  doc.setProducer('Bay Venues Talent Release Forms')
  doc.setCreator('Bay Venues Talent Release Forms')
  return doc.save()
}

/** "YYYY-MM-DD - Shoot reason - N forms.pdf", safe for Windows/SharePoint. */
export function batchFileName(shootDateISO: string, reason: string, count: number): string {
  const clean = (t: string) =>
    t.replace(/[\\/:*?"<>|#%~&{}\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60).trim()
  return `${shootDateISO} - ${clean(reason) || 'Shoot'} - ${count} ${count === 1 ? 'form' : 'forms'}.pdf`
}
