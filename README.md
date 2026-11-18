# Bay Venues Talent Release Form

A mobile-first web app for collecting talent release forms at photo and video shoots. One phone or iPad is passed around; each person fills in their details and signs, and staff finish the shoot with a single combined PDF (one page per person, in the style of the original form).

Static React + Vite + TypeScript site (Tailwind, pdf-lib, react-signature-canvas), hosted on Vercel. There is no server, database, login or analytics.

## Data handling (important)

- **Completed forms are stored on the device only**, in the browser's IndexedDB, under one "current shoot". Nothing is sent anywhere except through `deliverPdf` when staff save the PDF.
- Half-filled forms are never stored. Each person's form is saved the moment they submit, so a locked phone or page reload doesn't lose anyone.
- The shoot's data is deleted when staff finish the shoot, save the PDF and confirm it saved, when staff discard it, or automatically after **24 hours with no new signature** (checked when the app opens).
- Talent never see other people's details. The staff screen shows only the number of people signed.
- Staff controls sit behind a press-and-hold button. That stops accidental taps; it is not a security feature.
- Saved PDFs contain talent personal details and end up wherever staff send them (Files, AirDrop, Mail), so handle them accordingly.

## Delivery

All delivery goes through `deliverPdf(pdfBytes, fileName)` in `src/lib/deliverPdf.ts`: the device share sheet, falling back to a download. SharePoint delivery is planned but not built; when it is, only the inside of that function should change.

## Develop

```
npm install
npm run dev      # local dev server
npm run build    # type-check and build
```

Brand fonts: Museo Sans, see `public/fonts/README.md` (licence note included).

## Security

`vercel.json` sets security headers on every response: a strict Content-Security-Policy (own files only, no outside connections, no embedding), `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Permissions-Policy`, `Referrer-Policy: no-referrer` and `Cache-Control: no-store`.

If you add anything that loads from or talks to another domain (analytics, a CDN font, an API), the browser will block it until the Content-Security-Policy is updated. Treat that as a prompt to review the privacy impact first. Dependencies can be checked with `npm audit --omit=dev`.

## Personal information held

| Data | Why | Where | Deleted |
|---|---|---|---|
| Name, email, phone | Identify the signer | Staff device only (IndexedDB), then the PDF | After the PDF is saved and confirmed, on discard, or after 24 hours with no new signature |
| Under-18 status, guardian name | Consent for minors | As above | As above |
| Signature | Proof of consent | As above | As above |
| Shoot details | Context for the form | In memory, then the PDF | When the app is closed or reloaded |

The app does not encrypt data stored on the device, so devices should have a passcode.

## Using it at a shoot

1. Enter the shoot details and tap **Hand to talent**.
2. Each person fills in their details and signs. The app returns to a blank form for the next person.
3. When everyone has signed, hold **Staff: hold to open**, then **Finish shoot and save PDF**.
4. Save the PDF somewhere approved, then confirm it saved. Only then is the data deleted.

## Deployment and devices

Deployed on Vercel as a static site from `main` (no serverless functions or backend). Targets iPhone Safari and iPad. Staff can use Share > Add to Home Screen; the app does not work offline.

## Planned

SharePoint delivery (replacing the share sheet inside `deliverPdf`). It will need authentication or email sending, so it should get its own security review.
