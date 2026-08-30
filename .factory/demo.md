# Form Guard sample-data demo

- Demo URL: `https://dyslexia-form-guard.sociobot.in/lab/`
- Local URL after `npm run dev:site`: `http://localhost:5173/lab/`
- Sample data: five realistic form fields for Sam Rivera. Three intentional issues cover a repeated word, `emial` → `email`, and mismatched email confirmation.
- Reset: reload the page. The HTML restores the original sample values.
- Isolation: the form has no submit action and sends no data. Form Guard keeps scanned values only in the open popup's memory and does not save them to browser storage.
- Start for real: download the extension from the home page, then open it on the form you want to review.
