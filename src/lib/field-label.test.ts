import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { labelText } from './field-label';

describe('labelText', () => {
  it('does not treat a nested textarea value as label text', () => {
    const document = new JSDOM(
      '<label for="notes">Delivery notes<textarea id="notes">Send the the receipt to my emial address.</textarea></label>'
    ).window.document;
    const label = document.querySelector('label');

    expect(label).not.toBeNull();
    expect(labelText(label!)).toBe('Delivery notes');
  });

  it('keeps descriptive markup while excluding nested controls', () => {
    const document = new JSDOM(
      '<label>Full <strong>name</strong><input value="Sam Rivera" /></label>'
    ).window.document;
    const label = document.querySelector('label');

    expect(labelText(label!)).toBe('Full name');
  });
});
