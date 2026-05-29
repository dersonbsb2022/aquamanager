import type { WaterType } from '../types/api.js';

export const WATER_TYPES: { value: WaterType; label: string }[] = [
  { value: 'FRESHWATER', label: 'Doce' },
  { value: 'SALTWATER', label: 'Salgada' },
  { value: 'BRACKISH', label: 'Salobra' },
];

export type ParameterRangeInput = {
  waterType: WaterType;
  idealMin: string;
  idealMax: string;
};

export function emptyRangeInputs(): ParameterRangeInput[] {
  return WATER_TYPES.map((w) => ({ waterType: w.value, idealMin: '', idealMax: '' }));
}

export function rangesFromParameter(
  ranges: { waterType: WaterType; idealMin: number | null; idealMax: number | null }[] | undefined,
): ParameterRangeInput[] {
  const byType = new Map((ranges ?? []).map((r) => [r.waterType, r]));
  return WATER_TYPES.map((w) => {
    const r = byType.get(w.value);
    return {
      waterType: w.value,
      idealMin: r?.idealMin != null ? String(r.idealMin) : '',
      idealMax: r?.idealMax != null ? String(r.idealMax) : '',
    };
  });
}

export function parseRangeInputs(inputs: ParameterRangeInput[]): Array<{
  waterType: WaterType;
  idealMin: number | null;
  idealMax: number | null;
}> {
  const out: Array<{ waterType: WaterType; idealMin: number | null; idealMax: number | null }> = [];
  for (const row of inputs) {
    const minStr = row.idealMin.trim();
    const maxStr = row.idealMax.trim();
    if (!minStr && !maxStr) continue;
    const idealMin = minStr ? Number(minStr) : null;
    const idealMax = maxStr ? Number(maxStr) : null;
    if (minStr && Number.isNaN(idealMin)) throw new Error(`Mínimo inválido (${row.waterType})`);
    if (maxStr && Number.isNaN(idealMax)) throw new Error(`Máximo inválido (${row.waterType})`);
    out.push({ waterType: row.waterType, idealMin, idealMax });
  }
  if (out.length === 0) {
    throw new Error('Informe faixa ideal (mín. e/ou máx.) para pelo menos um tipo de água');
  }
  return out;
}

export function formatRangesSummary(
  ranges: { waterType: WaterType; idealMin: number | null; idealMax: number | null }[] | undefined,
): string {
  if (!ranges?.length) return '—';
  const parts: string[] = [];
  for (const w of WATER_TYPES) {
    const r = ranges.find((x) => x.waterType === w.value);
    if (!r || (r.idealMin == null && r.idealMax == null)) continue;
    const min = r.idealMin ?? '—';
    const max = r.idealMax ?? '—';
    parts.push(`${w.label}: ${min}–${max}`);
  }
  return parts.length ? parts.join(' · ') : '—';
}
