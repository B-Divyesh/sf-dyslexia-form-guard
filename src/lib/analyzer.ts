import type { FieldSnapshot, Finding } from './types';

const CHECK_WORDS = new Set([
  'address', 'amount', 'application', 'arrival', 'billing', 'business', 'country',
  'county', 'delivery', 'departure', 'email', 'emergency', 'employment', 'family',
  'first', 'government', 'insurance', 'last', 'mailing', 'middle', 'mobile',
  'month', 'nationality', 'number', 'payment', 'personal', 'phone', 'primary',
  'reference', 'residential', 'routing', 'shipping', 'signature', 'state', 'street',
  'telephone', 'the', 'their', 'there', 'verify', 'work', 'year', 'and', 'form'
]);

// A target word can be a valid, much more common word when its letters are
// swapped (for example, "from" → "form").  Form Guard deliberately skips
// those ambiguous cases: its job is a calm final pass, not a spell checker.
// Keep this list small and evidence-led so the expected sample remains useful.
const AMBIGUOUS_SOURCE_WORDS = new Set(['from', 'three']);

const NORMALISE_PAIR_WORDS = /\b(confirm|confirmation|retype|retyped|re-enter|reenter|repeat|again|verify|verification)\b/giu;
// JavaScript's \b only recognises ASCII "word" characters. Use explicit
// Unicode letter boundaries so names and addresses containing accented letters
// receive the same adjacent-duplicate check as ASCII text.
const REPEATED_WORD = /(?<![\p{L}\p{M}])([\p{L}][\p{L}\p{M}'’-]*)\s+\1(?![\p{L}\p{M}])/iu;

export function adjacentTranspositionCandidate(word: string): string | null {
  const lower = word.toLocaleLowerCase();
  if (lower.length < 3 || CHECK_WORDS.has(lower) || AMBIGUOUS_SOURCE_WORDS.has(lower)) return null;

  const matches = new Set<string>();
  for (let index = 0; index < lower.length - 1; index += 1) {
    if (lower[index] === lower[index + 1]) continue;
    const candidate = `${lower.slice(0, index)}${lower[index + 1]}${lower[index]}${lower.slice(index + 2)}`;
    if (CHECK_WORDS.has(candidate)) matches.add(candidate);
  }
  return matches.size === 1 ? ([...matches][0] ?? null) : null;
}

function normalizedPairLabel(label: string): string {
  return label
    .toLocaleLowerCase()
    .replace(NORMALISE_PAIR_WORDS, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function fieldFindingId(kind: string, indexes: number[]): string {
  return `${kind}:${indexes.join('-')}`;
}

export function analyseFields(fields: FieldSnapshot[]): Finding[] {
  const findings: Finding[] = [];

  for (const field of fields) {
    const repeated = field.value.match(REPEATED_WORD);
    if (repeated) {
      findings.push({
        id: fieldFindingId('repeat', [field.index]),
        kind: 'repeat',
        fieldIndexes: [field.index],
        title: 'Repeated word',
        detail: `“${repeated[1]}” appears twice in a row.`
      });
    }

    const words = field.value.match(/[\p{L}][\p{L}'’-]*/gu) ?? [];
    const transposition = words
      .map((word) => ({ word, candidate: adjacentTranspositionCandidate(word) }))
      .find(({ candidate }) => candidate !== null);
    if (transposition?.candidate) {
      findings.push({
        id: fieldFindingId('transposition', [field.index]),
        kind: 'transposition',
        fieldIndexes: [field.index],
        title: 'Possible swapped letters',
        detail: `Check “${transposition.word}”. Did you mean “${transposition.candidate}”?`
      });
    }

    if (!field.valid && (field.required || field.value.trim())) {
      findings.push({
        id: fieldFindingId('validation', [field.index]),
        kind: 'validation',
        fieldIndexes: [field.index],
        title: 'Field and value may not match',
        detail: field.validationMessage || `Check the value entered for ${field.label}.`
      });
    }
  }

  const paired = new Map<string, FieldSnapshot[]>();
  for (const field of fields) {
    const key = normalizedPairLabel(field.label);
    if (!key || !/(confirm|retype|re-enter|reenter|repeat|again|verify)/iu.test(field.label)) continue;
    const matchingFields = fields.filter((candidate) => normalizedPairLabel(candidate.label) === key);
    if (matchingFields.length > 1) paired.set(key, matchingFields);
  }

  for (const group of paired.values()) {
    const populated = group.filter((field) => field.value.trim());
    const values = new Set(populated.map((field) => field.value.trim()));
    if (populated.length > 1 && values.size > 1) {
      const indexes = populated.map((field) => field.index);
      findings.push({
        id: fieldFindingId('mismatch', indexes),
        kind: 'mismatch',
        fieldIndexes: indexes,
        title: 'Retyped values differ',
        detail: `${populated.map((field) => field.label).join(' and ')} do not match.`
      });
    }
  }

  return findings;
}
