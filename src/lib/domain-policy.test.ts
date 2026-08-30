import { describe, expect, it } from 'vitest';
import { sensitiveDomainReason, siteKey } from './domain-policy';

describe('sensitiveDomainReason', () => {
  it('@claim:sensitive-domain-pause pauses government domains and known banking and health providers by default', () => {
    expect(sensitiveDomainReason('forms.gov')).toBe('government domain');
    expect(sensitiveDomainReason('secure.mybank.example')).toBe('banking domain');
    expect(sensitiveDomainReason('patient.health.example')).toBe('health-related domain');
    expect(sensitiveDomainReason('hsbc.com')).toBe('banking domain');
    expect(sensitiveDomainReason('barclays.co.uk')).toBe('banking domain');
    expect(sensitiveDomainReason('mayoclinic.org')).toBe('health-related domain');
    expect(sensitiveDomainReason('clevelandclinic.org')).toBe('health-related domain');
    expect(sensitiveDomainReason('stanfordhealthcare.org')).toBe('health-related domain');
  });

  it('pauses known banking and health providers, including their subdomains', () => {
    expect(sensitiveDomainReason('chase.com')).toBe('banking domain');
    expect(sensitiveDomainReason('secure.chase.com')).toBe('banking domain');
    expect(sensitiveDomainReason('mychart.com')).toBe('health-related domain');
    expect(sensitiveDomainReason('portal.mychart.com')).toBe('health-related domain');
    expect(sensitiveDomainReason('cigna.com')).toBe('health-related domain');
    expect(sensitiveDomainReason('account.cigna.com')).toBe('health-related domain');
  });

  it('leaves ordinary sites available', () => {
    expect(sensitiveDomainReason('example.com')).toBeNull();
    expect(sensitiveDomainReason('riverbank.example')).toBeNull();
  });

  it('creates an origin-like site key without paths or values', () => {
    expect(siteKey('https://forms.example/path?q=private')).toBe('https://forms.example');
  });
});
