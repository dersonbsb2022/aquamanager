import { describe, expect, it } from 'vitest';
import {
  buildWaterStatusSnapshot,
  judgeParameterSnapshot,
} from '../src/shared/utils/water-parameter-snapshot.js';

describe('water parameter snapshot', () => {
  it('ok quando todos os parâmetros rastreados estão na faixa', () => {
    expect(judgeParameterSnapshot([true, true])).toBe('ok');
  });

  it('warning se algum parâmetro está fora, mesmo que o último teste só tenha um OK', () => {
    expect(judgeParameterSnapshot([true, false])).toBe('warning');
  });

  it('unknown sem valores com faixa definida', () => {
    expect(judgeParameterSnapshot([null, null])).toBe('unknown');
  });

  it('ignora parâmetros sem faixa ao julgar', () => {
    expect(judgeParameterSnapshot([null, true])).toBe('ok');
  });

  it('buildWaterStatusSnapshot lista parâmetros fora da faixa', () => {
    const status = buildWaterStatusSnapshot([
      {
        aquariumId: 'a1',
        parameterName: 'Nitrato',
        unit: 'ppm',
        value: 20,
        isWithinRange: false,
        lastTestedAt: new Date(),
      },
      {
        aquariumId: 'a1',
        parameterName: 'pH',
        unit: '',
        value: 8.1,
        isWithinRange: true,
        lastTestedAt: new Date(),
      },
    ]);
    expect(status.summary).toBe('warning');
    expect(status.outOfRangeCount).toBe(1);
    expect(status.outOfRangeParameters).toEqual(['Nitrato']);
  });
});
