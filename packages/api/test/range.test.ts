import { describe, expect, it } from 'vitest';
import { computeIsWithinRange } from '../src/shared/utils/range.js';

describe('utilitários de faixa', () => {
  it('dentro da faixa', () => {
    expect(computeIsWithinRange(7, { idealMin: 6.5, idealMax: 7.5 })).toBe(true);
  });
  it('fora da faixa', () => {
    expect(computeIsWithinRange(9, { idealMin: 6.5, idealMax: 7.5 })).toBe(false);
  });
  it('sem faixa', () => {
    expect(computeIsWithinRange(9, null)).toBe(null);
  });
});
