import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../services/api.js';
import type { AccessToken, Equipment } from '../types/api.js';
import { EQUIPMENT_TYPE_OPTIONS } from '../lib/equipmentTypes.js';
import { parseDatetimeLocal, toDatetimeLocalValue } from '../lib/datetimeLocal.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

type EquipmentFormDialogProps = {
  open: boolean;
  equipment: Equipment | null;
  aquariumId: string;
  token: AccessToken | null;
  onClose: () => void;
};

function toLocalOrEmpty(iso: string | null | undefined): string {
  if (!iso) return '';
  return toDatetimeLocalValue(new Date(iso));
}

function parseOptionalDatetime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = parseDatetimeLocal(trimmed);
  if (!d) throw new Error('Data/hora inválida.');
  return d.toISOString();
}

export function EquipmentFormDialog({
  open,
  equipment,
  aquariumId,
  token,
  onClose,
}: EquipmentFormDialogProps) {
  const qc = useQueryClient();
  const isEdit = equipment != null;

  const [type, setType] = useState<Equipment['type']>('FILTER');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [installedAtLocal, setInstalledAtLocal] = useState('');
  const [lastMaintenanceAtLocal, setLastMaintenanceAtLocal] = useState('');
  const [nextMaintenanceAtLocal, setNextMaintenanceAtLocal] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (equipment) {
      setType(equipment.type);
      setBrand(equipment.brand ?? '');
      setModel(equipment.model ?? '');
      setInstalledAtLocal(toLocalOrEmpty(equipment.installedAt));
      setLastMaintenanceAtLocal(toLocalOrEmpty(equipment.lastMaintenanceAt));
      setNextMaintenanceAtLocal(toLocalOrEmpty(equipment.nextMaintenanceAt));
      setNotes(equipment.notes ?? '');
    } else {
      setType('FILTER');
      setBrand('');
      setModel('');
      setInstalledAtLocal('');
      setLastMaintenanceAtLocal('');
      setNextMaintenanceAtLocal('');
      setNotes('');
    }
  }, [open, equipment]);

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        brand: brand.trim() === '' ? null : brand.trim(),
        model: model.trim() === '' ? null : model.trim(),
        installedAt: parseOptionalDatetime(installedAtLocal),
        lastMaintenanceAt: parseOptionalDatetime(lastMaintenanceAtLocal),
        nextMaintenanceAt: parseOptionalDatetime(nextMaintenanceAtLocal),
        notes: notes.trim() === '' ? null : notes.trim(),
      };

      if (isEdit && equipment) {
        return apiFetch<Equipment>(`/equipments/${equipment.id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(payload),
        });
      }

      return apiFetch<Equipment>(`/aquariums/${aquariumId}/equipments`, {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'equips'] });
      onClose();
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveM.mutate();
  }

  if (!open) return null;

  const pending = saveM.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="equipment-form-title">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Fechar" onClick={onClose} disabled={pending} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <form className="flex min-h-0 flex-col" onSubmit={onSubmit}>
          <div className="border-b border-border px-4 py-3">
            <h2 id="equipment-form-title" className="text-lg font-semibold text-foreground">
              {isEdit ? 'Editar equipamento' : 'Novo equipamento'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe tipo, marca, modelo e datas de manutenção.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eqType">Tipo</Label>
              <select
                id="eqType"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                value={type}
                disabled={pending}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {EQUIPMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eqBrand">Marca</Label>
                <Input
                  id="eqBrand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={pending}
                  placeholder="Ex: Eheim"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eqModel">Modelo</Label>
                <Input
                  id="eqModel"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={pending}
                  placeholder="Ex: Classic 250"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eqInstalled">Instalado em</Label>
              <Input
                id="eqInstalled"
                type="datetime-local"
                value={installedAtLocal}
                onChange={(e) => setInstalledAtLocal(e.target.value)}
                disabled={pending}
                className="max-w-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eqLastMaint">Última manutenção</Label>
                <Input
                  id="eqLastMaint"
                  type="datetime-local"
                  value={lastMaintenanceAtLocal}
                  onChange={(e) => setLastMaintenanceAtLocal(e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eqNextMaint">Próxima manutenção</Label>
                <Input
                  id="eqNextMaint"
                  type="datetime-local"
                  value={nextMaintenanceAtLocal}
                  onChange={(e) => setNextMaintenanceAtLocal(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eqNotes">Observações</Label>
              <textarea
                id="eqNotes"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={pending}
                placeholder="Ex: trocar mídia a cada 3 meses…"
              />
            </div>

            {saveM.isError ? <p className="text-sm text-red-500">{(saveM.error as Error).message}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvando…' : isEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
