import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import type { FieldSnapshot, ProbeResult } from '../src/lib/types';

const HIGHLIGHT_ID = 'form-guard-current-field';
type Editable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function visibleEditableFields(): Editable[] {
  return [...document.querySelectorAll<Editable>('input, textarea, select')].filter((element) => {
    if (element instanceof HTMLInputElement && ['hidden', 'submit', 'reset', 'button', 'image', 'file'].includes(element.type)) return false;
    if (element.disabled || ('readOnly' in element && element.readOnly)) return false;
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
  const labels = element.labels ? [...element.labels].map((label) => label.textContent?.trim()).filter(Boolean) : [];
  const labelledBy = element.getAttribute('aria-labelledby')
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean) ?? [];
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  const label = [...labels, ...labelledBy, ariaLabel].find(Boolean);
  if (label) return label.replace(/\s+/g, ' ').trim();
  const fallback = element.name || element.id;
  return fallback ? fallback.replace(/[_-]+/g, ' ') : `Unlabelled ${element instanceof HTMLSelectElement ? 'selection' : 'text'} field`;
}

function controlValue(element: Editable): string {
  if (element instanceof HTMLSelectElement) {
    return [...element.selectedOptions].map((option) => option.text).join(', ');
  }
  return element.value;
}

function snapshotFields(): FieldSnapshot[] {
  return visibleEditableFields()
    .filter((element) => !isPassword(element))
    .map((element, index) => ({
      index,
      label: fieldLabel(element),
      value: controlValue(element),
      controlType: element instanceof HTMLInputElement ? element.type : element.tagName.toLocaleLowerCase(),
      required: element.required,
      valid: element.validity.valid,
      validationMessage: element.validationMessage
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
