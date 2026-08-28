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

  it('flags adjacent repeated words with Unicode letters', () => {
    const findings = analyseFields([field(0, 'Street address', 'Thé thé address')]);
    expect(findings).toEqual([expect.objectContaining({
      kind: 'repeat',
      detail: '“Thé” appears twice in a row.'
    })]);
  });

  it('flags mismatched confirmation fields once', () => {
    const findings = analyseFields([
      field(0, 'Email', 'one@example.com'),
      field(1, 'Confirm email', 'two@example.com')
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'mismatch', fieldIndexes: [0, 1] });
  });

  it('reports invalid required blanks while leaving invalid optional blanks quiet', () => {
    const findings = analyseFields([
      field(0, 'Email', 'wrong', { controlType: 'email', valid: false, validationMessage: 'Include an @.' }),
      field(1, 'Phone', '', { valid: false, validationMessage: 'This field is required.', required: true }),
      field(2, 'Optional note', '', { valid: false, validationMessage: 'Optional fields may be blank.' })
    ]);
    expect(findings).toHaveLength(2);
    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ fieldIndexes: [0], detail: 'Include an @.' }),
      expect.objectContaining({ fieldIndexes: [1], kind: 'validation', detail: 'This field is required.' })
    ]));
    expect(findings.find((finding) => finding.fieldIndexes.includes(2))).toBeUndefined();
  });

  it('returns no findings for a clean form', () => {
    expect(analyseFields([field(0, 'Full name', 'Sam Rivera')])).toEqual([]);
  });
});
