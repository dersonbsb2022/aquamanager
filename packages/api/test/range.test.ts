import { describe, expect, it } from 'vitest';
import {
  computeIsWithinRange,
  evaluateParameterStatus,
  evaluateSalinityDensityStatus,
} from '../src/shared/utils/range.js';

describe('utilitários de faixa', () => {
  it('dentro da faixa genérica', () => {
    expect(computeIsWithinRange(7, { idealMin: 6.5, idealMax: 7.5 })).toBe(true);
  });

  it('fora da faixa genérica', () => {
    expect(computeIsWithinRange(9, { idealMin: 6.5, idealMax: 7.5 })).toBe(false);
    expect(evaluateParameterStatus(9, 'pH', { idealMin: 6.5, idealMax: 7.5 })).toBe('danger');
  });

  it('sem faixa', () => {
    expect(computeIsWithinRange(9, null)).toBe(null);
  });

  it('sem faixa não conta como fora (null, não false)', () => {
    expect(computeIsWithinRange(3.6, null, 'Nitrito (NO2)')).toBe(null);
  });

  describe('salinidade densidade (SG×1000)', () => {
    it('ideal 1024–1026', () => {
      expect(evaluateSalinityDensityStatus(1024)).toBe('ok');
      expect(evaluateSalinityDensityStatus(1025)).toBe('ok');
      expect(evaluateSalinityDensityStatus(1026)).toBe('ok');
    });

    it('atenção 1020–1023 e 1027–1030', () => {
      expect(evaluateSalinityDensityStatus(1020)).toBe('warning');
      expect(evaluateSalinityDensityStatus(1023)).toBe('warning');
      expect(evaluateSalinityDensityStatus(1027)).toBe('warning');
      expect(evaluateSalinityDensityStatus(1030)).toBe('warning');
    });

    it('crítico abaixo de 1020 ou acima de 1030', () => {
      expect(evaluateSalinityDensityStatus(1019)).toBe('danger');
      expect(evaluateSalinityDensityStatus(1031)).toBe('danger');
    });

    it('usa escala densidade mesmo com faixa ppt no banco', () => {
      expect(
        evaluateParameterStatus(1024, 'Salinidade', { idealMin: 33, idealMax: 35 }),
      ).toBe('ok');
      expect(
        evaluateParameterStatus(1024, 'Salinidade', { idealMin: 1024, idealMax: 1026 }),
      ).toBe('ok');
    });
  });
});
