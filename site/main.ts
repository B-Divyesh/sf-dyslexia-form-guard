import './styles.css';
import { analyseFields } from '../src/lib/analyzer';
import type { FieldSnapshot, Finding } from '../src/lib/types';

const PRODUCT = 'dyslexia-form-guard';
const API_BASE = 'https://api.sociobot.in/api/v1';
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const VERDICT_KEY = `sb_license_verdict:${PRODUCT}`;
const DAY = 86_400_000;

type LicenseVerdict = { valid: boolean; reason: string; checkedAt: number };

function elements() {
  return {
    form: document.querySelector<HTMLFormElement>('#license-form'),
    input: document.querySelector<HTMLInputElement>('#license-input'),
    message: document.querySelector<HTMLElement>('#license-message'),
    saved: document.querySelector<HTMLElement>('#saved-license'),
    preview: document.querySelector<HTMLElement>('#license-preview'),
    copy: document.querySelector<HTMLButtonElement>('#copy-license')
  };
}

function savedVerdict(): LicenseVerdict | null {
  try {
    const raw = localStorage.getItem(VERDICT_KEY);
    return raw ? JSON.parse(raw) as LicenseVerdict : null;
  } catch {
    return null;
  }
}

function showSavedLicense(token: string): void {
  const ui = elements();
  if (!ui.saved || !ui.preview) return;
  ui.preview.textContent = token.length > 12 ? `${token.slice(0, 6)}…${token.slice(-4)}` : 'saved';
  ui.saved.hidden = false;
}

async function verifyLicense(token: string, force = false): Promise<void> {
  const ui = elements();
  if (!token || !ui.message) return;
  showSavedLicense(token);
  const cached = savedVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) {
    ui.message.textContent = cached.valid ? 'Guard+ is active. Paste the saved token into the extension’s Guard+ panel.' : 'This license is not active. Free review remains available.';
    return;
  }
  ui.message.textContent = navigator.onLine ? 'Verifying license…' : 'Offline. The last saved verdict will be used.';
  try {
    const response = await fetch(`${API_BASE}/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const data = await response.json() as { valid: boolean; reason: string };
    const verdict = { valid: data.valid, reason: data.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    ui.message.textContent = data.valid
      ? 'Guard+ is active. Copy this token into the extension’s Guard+ panel to unlock it there.'
      : 'License no longer active. Check the token or buy Guard+; free review remains available.';
  } catch {
    ui.message.textContent = cached?.valid
      ? 'You appear to be offline. Guard+ remains active from the last check.'
      : 'License verification is unavailable. Check your connection and try again.';
  }
}

const query = new URLSearchParams(location.search);
const returnedLicense = query.get('license');
if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  query.delete('license');
  const replacement = `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`;
  history.replaceState(null, '', replacement);
}

const token = returnedLicense || localStorage.getItem(LICENSE_KEY) || '';
if (token) void verifyLicense(token);

const ui = elements();
ui.form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const submitted = ui.input?.value.trim() ?? '';
  if (!submitted) {
    if (ui.message) ui.message.textContent = 'Paste a license token first.';
    ui.input?.focus();
    return;
  }
  localStorage.setItem(LICENSE_KEY, submitted);
  if (ui.input) ui.input.value = '';
  void verifyLicense(submitted, true);
});
ui.copy?.addEventListener('click', async () => {
  const saved = localStorage.getItem(LICENSE_KEY);
  if (!saved || !ui.message) return;
  try {
    await navigator.clipboard.writeText(saved);
    ui.message.textContent = 'License copied. Open Form Guard, expand Guard+, and paste it there.';
  } catch {
    ui.message.textContent = 'Copy was blocked by the browser. Paste the token from your purchase email into the extension.';
  }
});

type DemoControl = HTMLInputElement | HTMLTextAreaElement;

function initialiseSampleDemo(): void {
  const form = document.querySelector<HTMLFormElement>('#sample-form');
  const counter = document.querySelector<HTMLElement>('#demo-field-counter');
  const findingCounter = document.querySelector<HTMLElement>('#demo-finding-counter');
  const label = document.querySelector<HTMLElement>('#demo-field-label');
  const value = document.querySelector<HTMLElement>('#demo-field-value');
  const findingsContainer = document.querySelector<HTMLElement>('#demo-findings');
  const previous = document.querySelector<HTMLButtonElement>('#demo-previous');
  const next = document.querySelector<HTMLButtonElement>('#demo-next');
  const read = document.querySelector<HTMLButtonElement>('#demo-read');
  const announcer = document.querySelector<HTMLElement>('#demo-announcer');
  if (!form || !counter || !findingCounter || !label || !value || !findingsContainer || !previous || !next || !read || !announcer) return;
  const sampleForm = form;
  const fieldCounter = counter;
  const totalFindings = findingCounter;
  const fieldLabel = label;
  const fieldValue = value;
  const findingList = findingsContainer;
  const previousButton = previous;
  const nextButton = next;
  const readButton = read;
  const liveAnnouncement = announcer;

  let position = 0;
  let currentFindings: Finding[] = [];

  const controls = (): DemoControl[] => [...sampleForm.querySelectorAll<DemoControl>('input, textarea')];
  const fields = (): FieldSnapshot[] => controls().map((control, index) => ({
    index,
    label: control.closest('label')?.childNodes[0]?.textContent?.trim() || control.name || `Field ${index + 1}`,
    value: control.value,
    controlType: control instanceof HTMLInputElement ? control.type : 'textarea',
    required: control.required,
    valid: control.validity.valid,
    validationMessage: control.validationMessage
  }));

  function findingsFor(index: number): Finding[] {
    return currentFindings.filter((finding) => finding.fieldIndexes.includes(index));
  }

  function render(): void {
    const sampleFields = fields();
    if (!sampleFields.length) return;
    position = Math.max(0, Math.min(sampleFields.length - 1, position));
    const field = sampleFields[position];
    if (!field) return;
    const relevant = findingsFor(field.index);
    controls().forEach((control, index) => control.classList.toggle('demo-highlight', index === field.index));
    fieldCounter.textContent = `FIELD ${String(position + 1).padStart(2, '0')} / ${String(sampleFields.length).padStart(2, '0')}`;
    totalFindings.textContent = currentFindings.length === 0 ? 'NO ALERTS' : `${currentFindings.length} ${currentFindings.length === 1 ? 'CHECK' : 'CHECKS'}`;
    totalFindings.classList.toggle('clear', currentFindings.length === 0);
    fieldLabel.textContent = field.label;
    fieldValue.textContent = field.value || 'Blank';
    findingList.replaceChildren();
    if (!relevant.length) {
      const clear = document.createElement('p');
      clear.className = 'demo-clear';
      clear.textContent = 'No alert for this field. Still check that it says what you intend.';
      findingList.append(clear);
    } else {
      for (const finding of relevant) {
        const item = document.createElement('article');
        item.className = 'finding';
        const title = document.createElement('span');
        title.textContent = `CHECK / ${finding.title}`;
        const detail = document.createElement('p');
        detail.textContent = finding.detail;
        item.append(title, detail);
        findingList.append(item);
      }
    }
    previousButton.disabled = position === 0;
    nextButton.disabled = position === sampleFields.length - 1;
    liveAnnouncement.textContent = `${field.label}. ${relevant.length ? `${relevant.length} alert.` : 'No alert.'} Field ${position + 1} of ${sampleFields.length}.`;
  }

  function analyse(preferFlagged = false): void {
    currentFindings = analyseFields(fields());
    if (preferFlagged) {
      const lastFlagged = Math.max(-1, ...currentFindings.flatMap((finding) => finding.fieldIndexes));
      position = lastFlagged >= 0 ? lastFlagged : 0;
    }
    render();
  }

  function move(amount: -1 | 1): void {
    window.speechSynthesis?.cancel();
    position += amount;
    render();
    fieldLabel.focus({ preventScroll: true });
  }

  function readCurrentField(): void {
    if (!('speechSynthesis' in window)) {
      liveAnnouncement.textContent = 'Read aloud is not available in this browser.';
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
    const field = fields()[position];
    if (!field) return;
    const spokenFindings = findingsFor(field.index).map((finding) => `${finding.title}. ${finding.detail}`).join(' ');
    const utterance = new SpeechSynthesisUtterance(`${field.label}. ${field.value || 'Blank'}. ${spokenFindings}`);
    utterance.rate = 0.88;
    utterance.onstart = () => { readButton.textContent = 'Stop reading'; };
    utterance.onend = utterance.onerror = () => { readButton.textContent = 'Read field'; };
    readButton.dataset.lastSpoken = `${field.label}: ${field.value}`;
    window.speechSynthesis.speak(utterance);
  }

  sampleForm.addEventListener('submit', (event) => event.preventDefault());
  sampleForm.addEventListener('input', () => analyse());
  sampleForm.addEventListener('reset', () => window.setTimeout(() => analyse(true), 0));
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  readButton.addEventListener('click', readCurrentField);
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  window.addEventListener('pagehide', () => window.speechSynthesis?.cancel());
  analyse(true);
}

initialiseSampleDemo();
