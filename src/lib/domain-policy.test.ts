import { describe, expect, it } from 'vitest';
import { sensitiveDomainReason, siteKey } from './domain-policy';

describe('sensitiveDomainReason', () => {
  it('blocks government, banking and health hosts by default', () => {
    expect(sensitiveDomainReason('forms.gov')).toBe('government domain');
    expect(sensitiveDomainReason('secure.mybank.example')).toBe('banking domain');
    expect(sensitiveDomainReason('patient.health.example')).toBe('health-related domain');
  });

  it('leaves ordinary sites available', () => {
    expect(sensitiveDomainReason('example.com')).toBeNull();
  });

  it('creates an origin-like site key without paths or values', () => {
    expect(siteKey('https://forms.example/path?q=private')).toBe('https://forms.example');
  });
});
