/** Converte caminho salvo no banco (/uploads/…) em URL acessível pelo browser */
export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl?.trim()) return null;
  const p = photoUrl.trim();
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('blob:')) return p;
  const path = p.startsWith('/') ? p : `/uploads/${p}`;
  if (import.meta.env.DEV) return `/api${path}`;
  const base = import.meta.env.VITE_API_URL;
  if (typeof base === 'string' && base.length > 0) return `${base.replace(/\/$/, '')}${path}`;
  return path;
}
