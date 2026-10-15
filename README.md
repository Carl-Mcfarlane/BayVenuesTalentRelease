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

Brand fonts: see `public/fonts/README.md`.
