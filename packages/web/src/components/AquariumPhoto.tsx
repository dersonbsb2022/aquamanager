import { resolvePhotoUrl } from '../lib/photoUrl.js';

type AquariumPhotoProps = {
  src?: string | null;
  name: string;
  /** hero = painel de informações; card = lista do painel; inline = cabeçalho */
  variant?: 'hero' | 'card' | 'inline';
  className?: string;
};

export function AquariumPhoto({ src, name, variant = 'hero', className = '' }: AquariumPhotoProps) {
  const resolved = resolvePhotoUrl(src);
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';

  if (variant === 'inline') {
    if (resolved) {
      return (
        <img
          src={resolved}
          alt=""
          className={`max-h-16 max-w-[10rem] rounded-lg border border-border object-contain bg-muted/40 ${className}`}
        />
      );
    }
    return (
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground ${className}`}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  if (variant === 'card') {
    if (resolved) {
      return (
        <div className={`h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 ${className}`}>
          <img src={resolved} alt="" className="h-full w-full object-contain" />
        </div>
      );
    }
    return (
      <div
        className={`flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground ${className}`}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  // hero
  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        className={`max-h-64 w-full max-w-full rounded-xl border border-border object-contain bg-muted/60 shadow-sm sm:max-w-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-40 w-full max-w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted text-2xl font-medium text-muted-foreground sm:max-w-md ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
