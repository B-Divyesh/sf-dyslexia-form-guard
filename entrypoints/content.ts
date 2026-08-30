import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { labelText } from '../src/lib/field-label';
import type { FieldSnapshot, ProbeResult } from '../src/lib/types';

const HIGHLIGHT_ID = 'form-guard-current-field';
type NativeEditable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Editable = NativeEditable | HTMLElement;

function isNativeEditable(element: HTMLElement): element is NativeEditable {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}

function visibleEditableFields(): Editable[] {
  return [...document.querySelectorAll<HTMLElement>('input, textarea, select, [contenteditable]:not([contenteditable="false"])')].filter((element) => {
    if (element instanceof HTMLInputElement && ['hidden', 'submit', 'reset', 'button', 'image', 'file'].includes(element.type)) return false;
    if (isNativeEditable(element) && element.disabled) return false;
    if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && element.readOnly) return false;
    if (!isNativeEditable(element) && (!element.isContentEditable || element.getAttribute('aria-disabled') === 'true')) return false;
    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
  });
}

function isPassword(element: Editable): boolean {
  return element instanceof HTMLInputElement && (
    element.type === 'password' ||
    ['current-password', 'new-password'].includes(element.autocomplete)
  );
}

function fieldLabel(element: Editable): string {
  const nativeLabels = isNativeEditable(element) && element.labels ? [...element.labels] : [];
  const enclosingLabel = element.closest('label');
  const explicitLabels = element.id
    ? [...document.querySelectorAll<HTMLLabelElement>('label')].filter((label) => label.htmlFor === element.id)
    : [];
  const labels = [...new Set([...nativeLabels, ...explicitLabels, ...(enclosingLabel ? [enclosingLabel] : [])])]
    .map(labelText)
    .filter(Boolean);
  const labelledBy = element.getAttribute('aria-labelledby')
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean) ?? [];
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  const label = [...labels, ...labelledBy, ariaLabel].find(Boolean);
  if (label) return label.replace(/\s+/g, ' ').trim();
  const fallback = (isNativeEditable(element) ? element.name : '') || element.id;
  return fallback ? fallback.replace(/[_-]+/g, ' ') : `Unlabelled ${element instanceof HTMLSelectElement ? 'selection' : 'text'} field`;
}

function controlValue(element: Editable): string {
  if (element instanceof HTMLSelectElement) {
    return [...element.selectedOptions].map((option) => option.text).join(', ');
  }
  if (element instanceof HTMLInputElement && element.type === 'checkbox') {
    return element.checked ? 'Checked' : 'Not checked';
  }
  if (element instanceof HTMLInputElement && element.type === 'radio') {
    return element.checked ? 'Selected' : 'Not selected';
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
  return element.innerText.trim();
}

function snapshotFields(): FieldSnapshot[] {
  return visibleEditableFields()
    .filter((element) => !isPassword(element))
    .map((element, index) => ({
      index,
      label: fieldLabel(element),
      value: controlValue(element),
      controlType: element instanceof HTMLInputElement ? element.type : isNativeEditable(element) ? element.tagName.toLowerCase() : 'contenteditable',
      required: isNativeEditable(element) ? element.required : false,
      valid: isNativeEditable(element) ? element.validity.valid : true,
      validationMessage: isNativeEditable(element) ? element.validationMessage : ''
    }));
}

function highlightField(index: number): void {
  removeHighlight();
  const fields = visibleEditableFields().filter((element) => !isPassword(element));
  const field = fields[index];
  if (!field) return;
  field.id = field.id || HIGHLIGHT_ID;
  field.dataset.formGuardHighlighted = 'true';
  field.style.setProperty('outline', '4px solid #ffca58', 'important');
  field.style.setProperty('outline-offset', '3px', 'important');
  field.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'center'
  });
}

function removeHighlight(): void {
  const highlighted = document.querySelector<HTMLElement>('[data-form-guard-highlighted="true"]');
  if (!highlighted) return;
  highlighted.style.removeProperty('outline');
  highlighted.style.removeProperty('outline-offset');
  delete highlighted.dataset.formGuardHighlighted;
  if (highlighted.id === HIGHLIGHT_ID) highlighted.removeAttribute('id');
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!message || typeof message !== 'object' || !('type' in message)) return;
      const typed = message as { type: string; index?: number };

      if (typed.type === 'FORM_GUARD_PROBE') {
        const fields = visibleEditableFields();
        return Promise.resolve<ProbeResult>({
          hasEditableFields: fields.some((field) => !isPassword(field)),
          hasPasswordField: fields.some(isPassword)
        });
      }
      if (typed.type === 'FORM_GUARD_SCAN') {
        return Promise.resolve({ fields: snapshotFields(), pageTitle: document.title || location.hostname });
      }
      if (typed.type === 'FORM_GUARD_HIGHLIGHT' && typeof typed.index === 'number') {
        highlightField(typed.index);
        return Promise.resolve({ ok: true });
      }
      if (typed.type === 'FORM_GUARD_CLEAR') {
        removeHighlight();
        return Promise.resolve({ ok: true });
      }
    });
  }
});
