export function computePercentVolume(volumeTrocada: number, volumeAquario: number): number | null {
  if (!Number.isFinite(volumeAquario) || volumeAquario <= 0) return null;
  return (volumeTrocada / volumeAquario) * 100;
}
