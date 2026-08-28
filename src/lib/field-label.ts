const EMBEDDED_CONTROL_SELECTOR = 'input, textarea, select, button, output, meter, progress';

/**
 * Returns the human-facing text of a native label without serializing an
 * embedded control. In particular, a textarea's default value is textContent
 * of its enclosing label, but it is field data rather than label copy.
 */
export function labelText(label: HTMLLabelElement): string {
  const copy = label.cloneNode(true) as HTMLLabelElement;
  copy.querySelectorAll(EMBEDDED_CONTROL_SELECTOR).forEach((control) => control.remove());
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}
