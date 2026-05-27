/** Avalia valor contra faixa ideal; null se não há faixa aplicável ou ambos os limites são nulos */
export function computeIsWithinRange(
  value: number,
  range: { idealMin: number | null; idealMax: number | null } | null | undefined,
): boolean | null {
  if (!range) return null;
  const { idealMin, idealMax } = range;
  if (idealMin == null && idealMax == null) return null;
  if (idealMin != null && value < idealMin) return false;
  if (idealMax != null && value > idealMax) return false;
  return true;
}
