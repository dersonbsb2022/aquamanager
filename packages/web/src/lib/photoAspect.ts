export const PHOTO_ASPECT_OPTIONS = [
  { id: 'wide', label: 'Panorâmico', hint: '16:9 — aquários longos', ratio: 16 / 9 },
  { id: 'landscape', label: 'Paisagem', hint: '4:3', ratio: 4 / 3 },
  { id: 'square', label: 'Quadrado', hint: '1:1 — cubo / nano', ratio: 1 },
  { id: 'portrait', label: 'Retrato', hint: '3:4', ratio: 3 / 4 },
] as const;

export type PhotoAspectId = (typeof PHOTO_ASPECT_OPTIONS)[number]['id'];

export const DEFAULT_PHOTO_ASPECT: PhotoAspectId = 'wide';

export function aspectRatioFor(id: PhotoAspectId): number {
  const opt = PHOTO_ASPECT_OPTIONS.find((o) => o.id === id);
  return opt?.ratio ?? 16 / 9;
}
