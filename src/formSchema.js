// Describes every field on the Bay Venues talent release form.
// The original PDF is flat (no AcroForm fields), so `pdf` gives coordinates
// in pdf-lib points: page index (0-based), x/xEnd = start/end of the ruled
// line, y = height of the line measured from the BOTTOM of the page.
// Page is A4: 595.56 x 842.04.

/**
 * @typedef {{
 *   key: string, label: string,
 *   type: 'text'|'email'|'tel'|'date'|'signature'|'yesno',
 *   required: boolean,
 *   who: 'staff'|'talent',
 *   auto?: boolean,
 *   labelIfUnder18?: string,
 *   showIf?: { key: string, equals: string },
 *   pdf: { page: number, x: number, xEnd: number, y: number } | null,
 * }} FormField
 */

/** @type {FormField[]} */
export const fields = [
  // Talent. Order here is the order on screen. Asked first: under 18 or not.
  // When 'yes' the form switches to the child's name, a parent/guardian name
  // and the parent/guardian's contact details and signature (labelIfUnder18).
  // The original form has no guardian section, so the guardian name is
  // printed below the consent box.
  { key: 'under18', label: 'Are you under 18?', type: 'yesno', required: true, who: 'talent', pdf: null },
  { key: 'fullName', label: 'Full name', labelIfUnder18: "Child's full name", type: 'text', required: true, who: 'talent',
    pdf: { page: 0, x: 91, xEnd: 562, y: 637.5 } },
  { key: 'guardianName', label: 'Parent / guardian full name', type: 'text', required: true, who: 'talent',
    showIf: { key: 'under18', equals: 'yes' }, pdf: { page: 0, x: 200, xEnd: 541, y: 104 } },
  { key: 'email', label: 'Contact email', labelIfUnder18: 'Parent / guardian email', type: 'email', required: true, who: 'talent',
    pdf: { page: 0, x: 109, xEnd: 562, y: 613.5 } },
  { key: 'phone', label: 'Contact phone', labelIfUnder18: 'Parent / guardian phone', type: 'tel', required: true, who: 'talent',
    pdf: { page: 0, x: 115, xEnd: 562, y: 589.5 } },
  { key: 'signature', label: 'Signature', labelIfUnder18: 'Parent / guardian signature', type: 'signature', required: true, who: 'talent',
    pdf: { page: 0, x: 230, xEnd: 430, y: 139.5 } },
  // Filled automatically with today's date when the talent submits.
  { key: 'signedDate', label: 'Date', type: 'date', required: true, who: 'talent', auto: true,
    pdf: { page: 0, x: 455, xEnd: 541, y: 139.5 } },

  // Staff ("Bay Venues to complete")
  { key: 'photographer', label: "Photographer's name", type: 'text', required: true, who: 'staff',
    pdf: { page: 0, x: 133, xEnd: 561, y: 517.5 } },
  { key: 'reason', label: 'Reason for shoot', type: 'text', required: true, who: 'staff',
    // Printed on the "Shoot Description" line.
    pdf: { page: 0, x: 129, xEnd: 561, y: 493 } },
  { key: 'date', label: 'Shoot date', type: 'date', required: true, who: 'staff',
    pdf: { page: 0, x: 95, xEnd: 561, y: 468.5 } },
  // Not on the original form. Collected on screen; PDF placement undecided.
  { key: 'venue', label: 'Venue', type: 'text', required: true, who: 'staff', pdf: null },
]

export const fieldsFor = (who) => fields.filter((f) => f.who === who)

export const consentTitle = 'Talents consent'

// Wording copied from the original PDF. Shown on screen and drawn into the PDF.
export const consentParagraphs = [
  'For valuable consideration which I hereby acknowledge, I grant the person or entity photographing or recording me (“Photographer”) and its licensees and assignees full permission to license and/or use any photographs, film or recording (“Works”) taken of me (including my appearance, likeness and form), for any purpose whatsoever (including, but not limited to, advertising, packaging, marketing, and promotion, for any product or service). The Works may be cropped, altered, transformed, or reproduced in any way, in any current or future media (including, but not limited to, print, TV, film, digital and the internet), and may also be combined with any other works or text. I understand that I relinquish any right that I may have to examine or approve the completed Works or their use(s).',
  'I agree that I have no rights or copyright in the Works (and any derivative works). I hereby release the Photographer and its licensees and assignees from any and all claims and demands in connection with the Works or their future use.',
  'I understand that where readily retrievable, I may access any personal information of mine and may correct any personal details provided by me.',
]

// Final paragraph on the original form (adult talent).
export const ageParagraphAdult =
  'I am over 18 years of age and legally entitled to grant this consent for myself and/or my family.'

// NOT on the original form. Replaces the adult paragraph when "under 18" is
// chosen. Draft wording: Bay Venues should approve it before real use.
export const ageParagraphMinor =
  'I am the parent or legal guardian of the person named above, who is under 18 years of age, and I am legally entitled to grant this consent on their behalf.'

// Where the age paragraph sits on the original PDF (bottom-left coordinates),
// used to cover and replace it for under-18 talent.
export const ageParagraphPdf = { page: 0, x: 54, y: 166, width: 440, height: 24 }