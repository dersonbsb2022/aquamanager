/** Percentual da água trocada em relação ao volume total do aquário */
export function tpaPercentOfAquarium(volumeTrocadoL: number, volumeAquarioL: number): number | null {
  if (!Number.isFinite(volumeAquarioL) || volumeAquarioL <= 0) return null;
  if (!Number.isFinite(volumeTrocadoL) || volumeTrocadoL < 0) return null;
  return (volumeTrocadoL / volumeAquarioL) * 100;
}

/** Litros correspondentes a X% do volume do aquário */
export function litersFromTpaPercent(percent: number, volumeAquarioL: number): number | null {
  if (!Number.isFinite(volumeAquarioL) || volumeAquarioL <= 0) return null;
  if (!Number.isFinite(percent) || percent <= 0) return null;
  return (percent / 100) * volumeAquarioL;
}
