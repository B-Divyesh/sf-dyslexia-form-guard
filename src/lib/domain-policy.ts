const BANKING_SUFFIXES = [
  'americanexpress.com', 'bankofamerica.com', 'capitalone.com', 'chase.com', 'citibank.com',
  'discover.com', 'hsbc.com', 'barclays.co.uk', 'lloydsbank.com', 'natwest.com', 'pnc.com',
  'santander.com', 'td.com', 'truist.com', 'usbank.com', 'wellsfargo.com'
];

const HEALTH_SUFFIXES = [
  // Widely used patient portals and national health providers. This list is
  // intentionally conservative: a pause asks for per-origin consent; it never
  // prevents someone from using the local review after that explicit choice.
  'aetna.com', 'anthem.com', 'bcbs.com', 'cigna.com', 'cvshome.com',
  'clevelandclinic.org', 'kaiserpermanente.org', 'mayoclinic.org', 'mychart.com',
  'mychart.org', 'optum.com', 'stanfordhealthcare.org', 'unitedhealthcare.com',
  'walgreens.com'
];

const BANKING_LABELS = new Set(['bank', 'banking', 'creditunion', 'mortgage', 'mybank']);
const HEALTH_LABELS = new Set(['clinic', 'health', 'healthcare', 'hospital', 'medical', 'mychart', 'nhs', 'patient', 'pharmacy']);

function hasDomainSuffix(host: string, suffixes: string[]): boolean {
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export function sensitiveDomainReason(hostname: string): string | null {
  const host = hostname.toLocaleLowerCase().replace(/\.+$/, '').replace(/^www\./, '');
  const labels = host.split('.').filter(Boolean);
  if (labels.includes('gov')) {
    return 'government domain';
  }
  if (hasDomainSuffix(host, BANKING_SUFFIXES) || labels.some((label) => BANKING_LABELS.has(label))) {
    return 'banking domain';
  }
  if (hasDomainSuffix(host, HEALTH_SUFFIXES) || labels.some((label) => HEALTH_LABELS.has(label))) {
    return 'health-related domain';
  }
  return null;
}

export function siteKey(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}`;
}
