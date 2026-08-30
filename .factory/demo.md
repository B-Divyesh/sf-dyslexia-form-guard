# Form Guard sample-data demo

- Demo URL: `https://dyslexia-form-guard.sociobot.in/lab/`
- Local URL after `npm run dev:site`: `http://localhost:5173/lab/`
- First result: the page opens directly on the local review panel for Delivery notes. It shows three checks and the repeated-word plus adjacent-swap details without extension installation.
- Sample data: five realistic form fields for Sam Rivera. Three intentional issues cover a repeated word, `emial` → `email`, and mismatched email confirmation.
- Interaction: Previous, Next, and Read field operate the same one-field review concept as the extension. Editing a sample field recalculates local checks only in the current page.
- Reset: use the persistent **Reset demo** button. It restores the original values and the initial flagged field.
- Isolation: demo data is held only in form controls and JavaScript memory. The form prevents submission, writes no local/session storage, and sends no data. The extension keeps real scanned values only in the open popup's memory and does not save them to browser storage.
- Start for real: download the extension from the banner or home page, then open it on the form you want to review.
