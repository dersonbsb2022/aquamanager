import type { ChangeEvent, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Archive, Check, ImagePlus, Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils.js';

const variantStyles = {
  edit: 'text-muted-foreground hover:bg-accent hover:text-foreground',
  delete: 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
  save: 'text-sky-400 hover:bg-sky-500/10 hover:text-sky-300',
  neutral: 'text-muted-foreground hover:bg-accent hover:text-foreground',
} as const;

type RowIconVariant = keyof typeof variantStyles;

function iconForVariant(variant: RowIconVariant): LucideIcon {
  if (variant === 'delete') return Trash2;
  if (variant === 'save') return Check;
  return Pencil;
}

export const rowIconBoxClass =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-card transition-colors disabled:pointer-events-none disabled:opacity-40';

export function rowIconClass(variant: RowIconVariant = 'edit', extra?: string) {
  return cn(rowIconBoxClass, variantStyles[variant], extra);
}

export function RowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('inline-flex items-center gap-1', className)}>{children}</div>;
}

export function RowIconButton({
  variant = 'edit',
  title,
  disabled,
  loading,
  onClick,
  icon,
}: {
  variant?: RowIconVariant;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
}) {
  const Icon = icon ?? iconForVariant(variant);

  return (
    <button
      type="button"
      title={loading ? 'Aguarde…' : title}
      disabled={disabled || loading}
      onClick={onClick}
      className={rowIconClass(variant)}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="sr-only">{title}</span>
    </button>
  );
}

/** Botão de ícone que abre seletor de arquivo (ex.: foto) */
export function RowIconFileButton({
  title,
  accept,
  disabled,
  loading,
  onFile,
  icon: Icon = ImagePlus,
}: {
  title: string;
  accept: string;
  disabled?: boolean;
  loading?: boolean;
  onFile: (file: File) => void;
  icon?: LucideIcon;
}) {
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFile(file);
  }

  return (
    <label
      title={loading ? 'Aguarde…' : title}
      className={rowIconClass('edit', disabled || loading ? 'pointer-events-none opacity-40' : '')}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <input type="file" accept={accept} className="sr-only" disabled={disabled || loading} onChange={onChange} />
      <span className="sr-only">{title}</span>
    </label>
  );
}

type DeleteIconButtonProps = {
  confirmMessage: string;
  deleteFn: () => Promise<unknown>;
  onSuccess?: () => void | Promise<void>;
  title?: string;
  disabled?: boolean;
  icon?: LucideIcon;
};

/** Exclusão com confirmação — ícone de lixeira (ou ícone customizado, ex. arquivar) */
export function DeleteIconButton({
  confirmMessage,
  deleteFn,
  onSuccess,
  title = 'Excluir',
  disabled = false,
  icon,
}: DeleteIconButtonProps) {
  const m = useMutation({
    mutationFn: deleteFn,
    onSuccess: async () => {
      await onSuccess?.();
    },
  });

  function onClick() {
    const ok = typeof window !== 'undefined' && window.confirm(confirmMessage);
    if (ok) m.mutate();
  }

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <RowIconButton
        variant="delete"
        title={title}
        icon={icon}
        disabled={disabled}
        loading={m.isPending}
        onClick={onClick}
      />
      {m.isError ? <span className="sr-only">{(m.error as Error).message}</span> : null}
    </div>
  );
}

export { Archive };
