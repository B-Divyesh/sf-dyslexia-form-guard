const SENSITIVE_HOST_PARTS = [
  'bank', 'banking', 'creditunion', 'mortgage',
  'health', 'hospital', 'clinic', 'medical', 'patient', 'pharmacy', 'insurance', 'nhs'
];

export function sensitiveDomainReason(hostname: string): string | null {
  const host = hostname.toLocaleLowerCase().replace(/^www\./, '');
  if (/(^|\.)gov($|\.)/.test(host) || /\.gov\.[a-z]{2}$/.test(host)) {
    return 'government domain';
  }
  const part = SENSITIVE_HOST_PARTS.find((keyword) => host.includes(keyword));
  if (part) return part === 'bank' || part === 'banking' ? 'banking domain' : 'health-related domain';
  return null;
}

export function siteKey(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}`;
}
