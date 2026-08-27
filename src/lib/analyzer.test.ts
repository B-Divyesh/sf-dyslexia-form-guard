import { describe, expect, it } from 'vitest';
import { adjacentTranspositionCandidate, analyseFields } from './analyzer';
import type { FieldSnapshot } from './types';

function field(index: number, label: string, value: string, extras: Partial<FieldSnapshot> = {}): FieldSnapshot {
  return {
    index,
    label,
    value,
    controlType: 'text',
    required: false,
    valid: true,
    validationMessage: '',
    ...extras
  };
}

describe('adjacentTranspositionCandidate', () => {
  it('finds conservative adjacent swaps', () => {
    expect(adjacentTranspositionCandidate('emial')).toBe('email');
    expect(adjacentTranspositionCandidate('adn')).toBe('and');
    expect(adjacentTranspositionCandidate('street')).toBeNull();
    expect(adjacentTranspositionCandidate('Divyesh')).toBeNull();
  });
});

describe('analyseFields', () => {
  it('flags a repeated word and a transposition', () => {
    const findings = analyseFields([field(0, 'Street address', '12 the the emial road')]);
    expect(findings.map((finding) => finding.kind)).toEqual(['repeat', 'transposition']);
  });

  it('flags mismatched confirmation fields once', () => {
    const findings = analyseFields([
      field(0, 'Email', 'one@example.com'),
      field(1, 'Confirm email', 'two@example.com')
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe('mismatch');
    expect(findings[0].fieldIndexes).toEqual([0, 1]);
  });

  it('uses native validity without warning on empty optional fields', () => {
    const findings = analyseFields([
      field(0, 'Email', 'wrong', { controlType: 'email', valid: false, validationMessage: 'Include an @.' }),
      field(1, 'Phone', '', { valid: false, validationMessage: 'Required.' })
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].detail).toBe('Include an @.');
  });

  it('returns no findings for a clean form', () => {
    expect(analyseFields([field(0, 'Full name', 'Sam Rivera')])).toEqual([]);
  });
});
