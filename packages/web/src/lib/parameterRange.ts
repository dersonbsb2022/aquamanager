/** Espelha packages/api/src/shared/utils/range.ts para o frontend */

export const SALINITY_DENSITY = {
  idealMin: 1024,
  idealMax: 1026,
  warnLowMin: 1020,
  warnLowMax: 1023,
  warnHighMin: 1027,
  warnHighMax: 1030,
  scaleMin: 1018,
  scaleMax: 1032,
} as const;

export type ParameterRangeStatus = 'ok' | 'warning' | 'danger';

export function isSalinityDensityValue(value: number): boolean {
  return value >= 100;
}

export function evaluateSalinityDensityStatus(value: number): ParameterRangeStatus {
  const { idealMin, idealMax, warnLowMin, warnLowMax, warnHighMin, warnHighMax } = SALINITY_DENSITY;
  if (value >= idealMin && value <= idealMax) return 'ok';
  if ((value >= warnLowMin && value <= warnLowMax) || (value >= warnHighMin && value <= warnHighMax)) {
    return 'warning';
  }
  return 'danger';
}

export function evaluateParameterStatus(
  value: number,
  paramName: string | null | undefined,
  range: { idealMin: number | null; idealMax: number | null } | null | undefined,
): ParameterRangeStatus | null {
  if (paramName === 'Salinidade' && isSalinityDensityValue(value)) {
    return evaluateSalinityDensityStatus(value);
  }

  if (!range) return null;
  const { idealMin, idealMax } = range;
  if (idealMin == null && idealMax == null) return null;
  if (idealMin != null && value < idealMin) return 'danger';
  if (idealMax != null && value > idealMax) return 'danger';
  return 'ok';
}

export function salinityDensityBarPct(value: number): number {
  const { scaleMin, scaleMax } = SALINITY_DENSITY;
  const pct = ((value - scaleMin) / (scaleMax - scaleMin)) * 100;
  return Math.max(2, Math.min(98, pct));
}

export function idealRangeLabel(
  paramName: string,
  idealMin: number | null,
  idealMax: number | null,
  unit: string,
): string {
  if (paramName === 'Salinidade' && idealMin != null && idealMin >= 100) {
    const d = SALINITY_DENSITY;
    return `Ideal: ${d.idealMin}–${d.idealMax} · Atenção: ${d.warnLowMin}–${d.warnLowMax} ou ${d.warnHighMin}–${d.warnHighMax} · Crítico: abaixo de ${d.warnLowMin} ou acima de ${d.warnHighMax}`;
  }
  if (idealMin != null || idealMax != null) {
    return `Faixa ideal: ${idealMin ?? '—'} – ${idealMax ?? '—'} ${unit}`.trim();
  }
  return 'Sem faixa ideal cadastrada para este tipo de água.';
}
