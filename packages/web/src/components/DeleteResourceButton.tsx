import type { LucideIcon } from 'lucide-react';
import { DeleteIconButton } from './row-actions.js';

/** @deprecated Use DeleteIconButton from row-actions.js */
export function DeleteResourceButton({
  confirmMessage,
  deleteFn,
  onSuccess,
  title = 'Excluir',
  disabled = false,
  icon,
}: {
  confirmMessage: string;
  deleteFn: () => Promise<unknown>;
  onSuccess?: () => void | Promise<void>;
  title?: string;
  disabled?: boolean;
  showLabel?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <DeleteIconButton
      confirmMessage={confirmMessage}
      deleteFn={deleteFn}
      onSuccess={onSuccess}
      title={title}
      disabled={disabled}
      icon={icon}
    />
  );
}
