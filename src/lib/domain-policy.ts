const BANKING_SUFFIXES = [
  'americanexpress.com', 'bankofamerica.com', 'capitalone.com', 'chase.com', 'citibank.com',
  'discover.com', 'pnc.com', 'td.com', 'truist.com', 'usbank.com', 'wellsfargo.com'
];

const HEALTH_SUFFIXES = [
  'kaiserpermanente.org', 'mychart.com', 'mychart.org'
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
