import { resolvePhotoUrl } from '../lib/photoUrl.js';

type EntityThumbnailProps = {
  src?: string | null;
  fallbackLabel: string;
  className?: string;
  rounded?: 'full' | 'lg';
};

export function EntityThumbnail({ src, fallbackLabel, className = '', rounded = 'lg' }: EntityThumbnailProps) {
  const resolved = resolvePhotoUrl(src);
  const initial = fallbackLabel.trim().slice(0, 1).toUpperCase() || '?';
  const r = rounded === 'full' ? 'rounded-full' : 'rounded-lg';

  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        className={`shrink-0 object-cover border border-border bg-muted/40 ${r} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-border bg-muted text-sm font-medium text-muted-foreground ${r} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
