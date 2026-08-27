import './styles.css';

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
