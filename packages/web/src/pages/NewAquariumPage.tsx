import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type { WaterType } from '../types/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

type Created = { id: string };

export function NewAquariumPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Created>('/aquariums', { method: 'POST', body: JSON.stringify(body), token }),
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: ['aquariums'] });
      nav(`/aquariums/${row.id}`);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '');
    const volumeLiters = Number(fd.get('volumeLiters'));
    const waterType = String(fd.get('waterType') ?? 'FRESHWATER') as WaterType;
    m.mutate({ name, volumeLiters, waterType });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Novo aquário</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volumeLiters">Volume (litros)</Label>
            <Input id="volumeLiters" name="volumeLiters" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterType">Tipo de água</Label>
            <select
              id="waterType"
              name="waterType"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
              defaultValue="FRESHWATER"
            >
              <option value="FRESHWATER">Doce</option>
              <option value="SALTWATER">Salgada</option>
              <option value="BRACKISH">Salobra</option>
            </select>
          </div>
          {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
          <Button type="submit" disabled={m.isPending}>
            Salvar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
