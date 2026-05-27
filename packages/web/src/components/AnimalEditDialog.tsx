import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '../services/api.js';
import type { AccessToken, Animal } from '../types/api.js';
import { defaultDatetimeLocal, parseDatetimeLocal, toDatetimeLocalValue } from '../lib/datetimeLocal.js';
import { EntityThumbnail } from './EntityThumbnail.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

const STATUS_OPTIONS: { value: Animal['status']; label: string }[] = [
  { value: 'ALIVE', label: 'Vivo' },
  { value: 'DEAD', label: 'Morto' },
  { value: 'DONATED', label: 'Doado' },
  { value: 'TRANSFERRED', label: 'Transferido' },
];

type AnimalEditDialogProps = {
  animal: Animal;
  aquariumId: string;
  token: AccessToken | null;
  open: boolean;
  onClose: () => void;
};

export function AnimalEditDialog({ animal, aquariumId, token, open, onClose }: AnimalEditDialogProps) {
  const qc = useQueryClient();

  const [commonName, setCommonName] = useState('');
  const [speciesName, setSpeciesName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [addedAtLocal, setAddedAtLocal] = useState(defaultDatetimeLocal);
  const [status, setStatus] = useState<Animal['status']>('ALIVE');
  const [removedAtLocal, setRemovedAtLocal] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCommonName(animal.commonName);
    setSpeciesName(animal.speciesName);
    setQuantity(String(animal.quantity));
    setNotes(animal.notes ?? '');
    setAddedAtLocal(toDatetimeLocalValue(new Date(animal.addedDate)));
    setStatus(animal.status);
    setRemovedAtLocal(animal.removedDate ? toDatetimeLocalValue(new Date(animal.removedDate)) : '');
    setPhotoFile(null);
    setRemovePhoto(false);
    setPhotoPreview(null);
  }, [open, animal]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const saveM = useMutation({
    mutationFn: async () => {
      const addedDate = parseDatetimeLocal(addedAtLocal);
      if (!addedDate) throw new Error('Data de entrada inválida.');

      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty < 1) throw new Error('Quantidade inválida.');

      let removedDate: string | null = null;
      if (status !== 'ALIVE') {
        if (!removedAtLocal.trim()) throw new Error('Informe quando saiu do aquário.');
        const rd = parseDatetimeLocal(removedAtLocal);
        if (!rd) throw new Error('Data de saída inválida.');
        removedDate = rd.toISOString();
      }

      await apiFetch<Animal>(`/animals/${animal.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          commonName: commonName.trim(),
          speciesName: speciesName.trim(),
          quantity: qty,
          notes: notes.trim() === '' ? null : notes.trim(),
          addedDate: addedDate.toISOString(),
          status,
          removedDate,
        }),
      });

      if (photoFile) {
        await apiUpload<Animal>(`/animals/${animal.id}/photo`, photoFile, { token });
      } else if (removePhoto && animal.photoUrl) {
        await apiFetch<Animal>(`/animals/${animal.id}/photo`, { method: 'DELETE', token });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId] });
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'animals'] });
      onClose();
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveM.mutate();
  }

  if (!open) return null;

  const displayPhoto = photoPreview ?? (removePhoto ? null : animal.photoUrl);
  const pending = saveM.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="animal-edit-title">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fechar" onClick={onClose} disabled={pending} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <form className="flex min-h-0 flex-col" onSubmit={onSubmit}>
          <div className="border-b border-border px-4 py-3">
            <h2 id="animal-edit-title" className="text-lg font-semibold text-foreground">
              Editar animal
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Altere dados, foto, data de entrada ou status.</p>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <EntityThumbnail src={displayPhoto} fallbackLabel={commonName || animal.commonName} className="h-16 w-16" rounded="full" />
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-muted/40">
                  {photoFile || animal.photoUrl ? 'Trocar foto' : 'Adicionar foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) {
                        setPhotoFile(file);
                        setRemovePhoto(false);
                      }
                    }}
                  />
                </label>
                {(animal.photoUrl || photoFile) && !removePhoto ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setPhotoFile(null);
                      setRemovePhoto(true);
                    }}
                  >
                    Remover foto
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCommonName">Nome popular</Label>
              <Input id="editCommonName" value={commonName} onChange={(e) => setCommonName(e.target.value)} required disabled={pending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSpeciesName">Espécie (científico)</Label>
              <Input id="editSpeciesName" value={speciesName} onChange={(e) => setSpeciesName(e.target.value)} required disabled={pending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editQuantity">Quantidade</Label>
              <Input
                id="editQuantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={pending}
                className="max-w-[8rem]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddedAt">Entrou no aquário em</Label>
              <Input
                id="editAddedAt"
                type="datetime-local"
                value={addedAtLocal}
                onChange={(e) => setAddedAtLocal(e.target.value)}
                required
                disabled={pending}
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <select
                id="editStatus"
                className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-sm text-foreground"
                value={status}
                disabled={pending}
                onChange={(e) => setStatus(e.target.value as Animal['status'])}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {status !== 'ALIVE' ? (
              <div className="space-y-2">
                <Label htmlFor="editRemovedAt">Saiu do aquário em</Label>
                <Input
                  id="editRemovedAt"
                  type="datetime-local"
                  value={removedAtLocal}
                  onChange={(e) => setRemovedAtLocal(e.target.value)}
                  required
                  disabled={pending}
                  className="max-w-xs"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="editNotes">Observações</Label>
              <textarea
                id="editNotes"
                rows={3}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={pending}
                placeholder="Notas sobre o animal…"
              />
            </div>

            {saveM.isError ? <p className="text-sm text-red-600">{(saveM.error as Error).message}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
