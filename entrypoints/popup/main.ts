import { browser } from 'wxt/browser';
import { analyseFields } from '../../src/lib/analyzer';
import { sensitiveDomainReason, siteKey } from '../../src/lib/domain-policy';
import type { FieldSnapshot, Finding, ProbeResult } from '../../src/lib/types';
import './style.css';

const PRODUCT = 'dyslexia-form-guard';
const BILLING_API = 'https://api.sociobot.in/api/v1';
const DAY = 86_400_000;

type ViewName = 'ready' | 'loading' | 'blocked' | 'empty' | 'error' | 'review';
type LicenseCache = { valid: boolean; checkedAt: number };

const elements = {
  views: Object.fromEntries([...document.querySelectorAll<HTMLElement>('.view')].map((view) => [view.id.replace('-view', ''), view])) as Record<ViewName, HTMLElement>,
  scanButton: document.querySelector<HTMLButtonElement>('#scan-button')!,
  blockedDetail: document.querySelector<HTMLElement>('#blocked-detail')!,
  enableSiteButton: document.querySelector<HTMLButtonElement>('#enable-site-button')!,
  errorDetail: document.querySelector<HTMLElement>('#error-detail')!,
  fieldCounter: document.querySelector<HTMLElement>('#field-counter')!,
  findingCounter: document.querySelector<HTMLElement>('#finding-counter')!,
  fieldLabel: document.querySelector<HTMLElement>('#field-label')!,
  fieldValue: document.querySelector<HTMLElement>('#field-value')!,
  fieldFindings: document.querySelector<HTMLElement>('#field-findings')!,
  previousButton: document.querySelector<HTMLButtonElement>('#previous-button')!,
  nextButton: document.querySelector<HTMLButtonElement>('#next-button')!,
  speakButton: document.querySelector<HTMLButtonElement>('#speak-button')!,
  finishButton: document.querySelector<HTMLButtonElement>('#finish-button')!,
  announcer: document.querySelector<HTMLElement>('#announcer')!,
  networkStatus: document.querySelector<HTMLElement>('#network-status')!,
  licenseStatus: document.querySelector<HTMLElement>('#license-status')!,
  flaggedFirst: document.querySelector<HTMLInputElement>('#flagged-first')!,
  restoreForm: document.querySelector<HTMLFormElement>('#restore-form')!,
  licenseToken: document.querySelector<HTMLInputElement>('#license-token')!
};

let activeTabId: number | undefined;
let blockedSite = '';
let fields: FieldSnapshot[] = [];
let findings: Finding[] = [];
let position = 0;
let plusActive = false;

function showView(name: ViewName): void {
  for (const [viewName, view] of Object.entries(elements.views)) view.hidden = viewName !== name;
}

function updateNetworkStatus(): void {
  elements.networkStatus.innerHTML = navigator.onLine
    ? '<span aria-hidden="true">●</span> LOCAL'
    : '<span aria-hidden="true">●</span> OFFLINE / LOCAL';
  elements.networkStatus.classList.toggle('offline', !navigator.onLine);
}

async function activeTab(): Promise<{ id: number; url: string }> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) throw new Error('Open a regular web page, then try again. Browser settings and store pages cannot be reviewed.');
  return { id: tab.id, url: tab.url };
}

async function allowed(site: string): Promise<boolean> {
  const stored = await browser.storage.local.get('allowedSites');
  return Array.isArray(stored.allowedSites) && stored.allowedSites.includes(site);
}

async function allowCurrentSite(): Promise<void> {
  if (!blockedSite) return;
  const stored = await browser.storage.local.get('allowedSites');
  const sites = Array.isArray(stored.allowedSites) ? stored.allowedSites.filter((item): item is string => typeof item === 'string') : [];
  if (!sites.includes(blockedSite)) sites.push(blockedSite);
  await browser.storage.local.set({ allowedSites: sites });
  await runScan(true);
}

function block(reason: string, site: string): void {
  blockedSite = site;
  elements.blockedDetail.textContent = `Form Guard is paused because this looks like a ${reason}. Review can run only after you enable this site.`;
  showView('blocked');
  elements.enableSiteButton.focus();
}

async function runScan(skipPolicy = false): Promise<void> {
  showView('loading');
  elements.announcer.textContent = 'Scanning visible form fields locally.';
  try {
    const tab = await activeTab();
    activeTabId = tab.id;
    const site = siteKey(tab.url);
    const isAllowed = skipPolicy || await allowed(site);
    const domainReason = sensitiveDomainReason(new URL(tab.url).hostname);
    if (domainReason && !isAllowed) return block(domainReason, site);

    const probe = await browser.tabs.sendMessage(tab.id, { type: 'FORM_GUARD_PROBE' }) as ProbeResult;
    if (probe.hasPasswordField && !isAllowed) return block('page with a password field', site);
    if (!probe.hasEditableFields) {
      showView('empty');
      document.querySelector<HTMLButtonElement>('.retry-button')?.focus();
      return;
    }

    const result = await browser.tabs.sendMessage(tab.id, { type: 'FORM_GUARD_SCAN' }) as { fields: FieldSnapshot[] };
    fields = result.fields;
    findings = analyseFields(fields);
    if (!fields.length) {
      showView('empty');
      return;
    }
    const stored = await browser.storage.local.get('flaggedFirst');
    if (plusActive && stored.flaggedFirst === true) {
      const flagged = new Set(findings.flatMap((finding) => finding.fieldIndexes));
      fields.sort((a, b) => Number(flagged.has(b.index)) - Number(flagged.has(a.index)));
    }
    position = 0;
    showView('review');
    renderField();
    elements.fieldLabel.focus({ preventScroll: true });
  } catch (error) {
    showView('error');
    elements.errorDetail.textContent = error instanceof Error ? error.message : 'Reload the page and try again.';
  }
}

function fieldFindings(field: FieldSnapshot): Finding[] {
  return findings.filter((finding) => finding.fieldIndexes.includes(field.index));
}

function renderField(): void {
  const field = fields[position];
  if (!field) {
    showView('empty');
    return;
  }
  const relevant = fieldFindings(field);
  elements.fieldCounter.textContent = `FIELD ${String(position + 1).padStart(2, '0')} / ${String(fields.length).padStart(2, '0')}`;
  elements.findingCounter.textContent = findings.length === 0 ? 'NO ALERTS' : `${findings.length} ${findings.length === 1 ? 'CHECK' : 'CHECKS'}`;
  elements.findingCounter.classList.toggle('clear', findings.length === 0);
  elements.fieldLabel.textContent = field.label;
  elements.fieldValue.textContent = field.value || 'Blank';
  elements.fieldValue.classList.toggle('is-blank', !field.value);
  elements.fieldFindings.replaceChildren();
  if (!relevant.length) {
    const clear = document.createElement('p');
    clear.className = 'clear-message';
    clear.innerHTML = '<span aria-hidden="true">✓</span><span><b>No alert for this field.</b><small>Still check that the value says what you intend.</small></span>';
    elements.fieldFindings.append(clear);
  } else {
    for (const finding of relevant) {
      const item = document.createElement('article');
      item.className = 'finding';
      const label = document.createElement('p');
      label.className = 'finding-type';
      label.textContent = `CHECK / ${finding.title}`;
      const detail = document.createElement('p');
      detail.textContent = finding.detail;
      item.append(label, detail);
      elements.fieldFindings.append(item);
    }
  }
  elements.previousButton.disabled = position === 0;
  elements.nextButton.disabled = position === fields.length - 1;
  elements.nextButton.querySelector('span')!.textContent = position === fields.length - 1 ? 'Last' : 'Next';
  elements.announcer.textContent = `${field.label}. ${relevant.length ? `${relevant.length} alert.` : 'No alert.'} Field ${position + 1} of ${fields.length}.`;
  if (activeTabId) void browser.tabs.sendMessage(activeTabId, { type: 'FORM_GUARD_HIGHLIGHT', index: field.index }).catch(() => undefined);
}

function move(direction: -1 | 1): void {
  const next = Math.max(0, Math.min(fields.length - 1, position + direction));
  if (next === position) return;
  window.speechSynthesis.cancel();
  position = next;
  renderField();
}

function speakCurrentField(): void {
  if (!('speechSynthesis' in window)) {
    elements.announcer.textContent = 'Read aloud is not available in this browser.';
    return;
  }
  window.speechSynthesis.cancel();
  const field = fields[position];
  if (!field) return;
  const relevant = fieldFindings(field);
  const text = `${field.label}. ${field.value || 'Blank'}. ${relevant.map((finding) => `${finding.title}. ${finding.detail}`).join(' ')}`;
  elements.speakButton.dataset.lastRead = text;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88;
  utterance.onstart = () => {
    elements.speakButton.classList.add('speaking');
    elements.speakButton.querySelector('span')!.textContent = 'Stop';
  };
  utterance.onend = utterance.onerror = () => {
    elements.speakButton.classList.remove('speaking');
    elements.speakButton.querySelector('span')!.textContent = 'Read';
  };
  window.speechSynthesis.speak(utterance);
}

async function finishReview(): Promise<void> {
  window.speechSynthesis.cancel();
  if (activeTabId) await browser.tabs.sendMessage(activeTabId, { type: 'FORM_GUARD_CLEAR' }).catch(() => undefined);
  fields = [];
  findings = [];
  showView('ready');
  elements.scanButton.focus();
  elements.announcer.textContent = 'Review finished. The page highlight is cleared.';
}

async function verifyLicense(token: string, force = false): Promise<void> {
  const stored = await browser.storage.local.get(['licenseCache', 'licenseToken']);
  const cache = stored.licenseCache as LicenseCache | undefined;
  plusActive = Boolean(cache?.valid);
  updatePlusUi();
  if (!token || (!force && cache && Date.now() - cache.checkedAt < DAY)) return;

  try {
    const response = await fetch(`${BILLING_API}/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification unavailable');
    const verdict = await response.json() as { valid: boolean; reason: string };
    plusActive = verdict.valid;
    await browser.storage.local.set({ licenseToken: token, licenseCache: { valid: verdict.valid, checkedAt: Date.now() } });
    updatePlusUi(verdict.valid ? 'Guard+ is active on this browser.' : 'License no longer active. Free review remains available.');
  } catch {
    updatePlusUi(plusActive ? 'Guard+ is active from the last verification. Offline checks continue locally.' : 'Could not verify right now. Free review remains available.');
  }
}

function updatePlusUi(message?: string): void {
  elements.flaggedFirst.disabled = !plusActive;
  elements.licenseStatus.textContent = message ?? (plusActive
    ? 'Guard+ is active. Your review still runs entirely in this browser.'
    : 'Free review is active. Guard+ adds flagged-first ordering for a $12 one-time purchase.');
}

elements.scanButton.addEventListener('click', () => void runScan());
document.querySelectorAll<HTMLButtonElement>('.retry-button').forEach((button) => button.addEventListener('click', () => void runScan()));
elements.enableSiteButton.addEventListener('click', () => void allowCurrentSite());
document.querySelector<HTMLButtonElement>('#cancel-block-button')!.addEventListener('click', () => showView('ready'));
elements.previousButton.addEventListener('click', () => move(-1));
elements.nextButton.addEventListener('click', () => move(1));
elements.speakButton.addEventListener('click', () => window.speechSynthesis.speaking ? window.speechSynthesis.cancel() : speakCurrentField());
elements.finishButton.addEventListener('click', () => void finishReview());
elements.flaggedFirst.addEventListener('change', () => void browser.storage.local.set({ flaggedFirst: elements.flaggedFirst.checked }));
elements.restoreForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = elements.licenseToken.value.trim();
  if (!token) return;
  elements.licenseStatus.textContent = 'Verifying license…';
  void verifyLicense(token, true).finally(() => { elements.licenseToken.value = ''; });
});
document.addEventListener('keydown', (event) => {
  if (elements.views.review.hidden || event.target instanceof HTMLInputElement) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
});
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
window.addEventListener('pagehide', () => window.speechSynthesis.cancel());

updateNetworkStatus();
void browser.storage.local.get(['licenseToken', 'flaggedFirst']).then((stored) => {
  elements.flaggedFirst.checked = stored.flaggedFirst === true;
  void verifyLicense(typeof stored.licenseToken === 'string' ? stored.licenseToken : '');
});
