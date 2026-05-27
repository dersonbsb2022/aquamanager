import type { ReactNode } from 'react';
import type { Animal } from '../types/api.js';
import { resolvePhotoUrl } from '../lib/photoUrl.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { EntityThumbnail } from './EntityThumbnail.js';

const STATUS_LABEL: Record<Animal['status'], string> = {
  ALIVE: 'Vivo',
  DEAD: 'Morto',
  DONATED: 'Doado',
  TRANSFERRED: 'Transferido',
};

function statusBadgeVariant(status: Animal['status']): 'success' | 'default' | 'warning' | 'danger' {
  if (status === 'ALIVE') return 'success';
  if (status === 'DEAD') return 'danger';
  return 'warning';
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

type AnimalViewDialogProps = {
  animal: Animal;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
};

export function AnimalViewDialog({ animal, open, onClose, onEdit }: AnimalViewDialogProps) {
  if (!open) return null;

  const photoSrc = resolvePhotoUrl(animal.photoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="animal-view-title">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Fechar" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="border-b border-border px-4 py-3">
          <h2 id="animal-view-title" className="text-lg font-semibold text-foreground">
            {animal.commonName}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{animal.speciesName}</p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <div className="flex justify-center">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt=""
                className="max-h-56 w-full max-w-xs rounded-xl border border-border object-contain bg-muted/40"
              />
            ) : (
              <EntityThumbnail
                src={null}
                fallbackLabel={animal.commonName}
                className="h-40 w-40 text-3xl"
                rounded="lg"
              />
            )}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Nome popular">{animal.commonName}</DetailRow>
            <DetailRow label="Espécie (científico)">{animal.speciesName}</DetailRow>
            <DetailRow label="Quantidade">{animal.quantity}</DetailRow>
            <DetailRow label="Status">
              <Badge variant={statusBadgeVariant(animal.status)}>{STATUS_LABEL[animal.status]}</Badge>
            </DetailRow>
            <DetailRow label="Entrou no aquário">
              {new Date(animal.addedDate).toLocaleString('pt-BR')}
            </DetailRow>
            {animal.removedDate ? (
              <DetailRow label="Saiu do aquário">{new Date(animal.removedDate).toLocaleString('pt-BR')}</DetailRow>
            ) : null}
          </dl>

          {animal.notes ? (
            <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{animal.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
          {onEdit ? (
            <Button type="button" variant="outline" onClick={onEdit}>
              Editar
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
