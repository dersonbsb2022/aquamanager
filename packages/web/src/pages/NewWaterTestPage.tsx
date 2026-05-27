import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type { Paginated, TestParameter, WaterTest } from '../types/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

export function NewWaterTestPage() {
  const { aquariumId } = useParams<{ aquariumId: string }>();
  const nav = useNavigate();
  const { token } = useAuth();

  const id = aquariumId!;

  const tpQ = useQuery({
    queryKey: ['test-parameters'],
    queryFn: () =>
      apiFetch<Paginated<TestParameter>>(`/test-parameters?page=1&perPage=100`, {
        token,
      }),
    enabled: Boolean(token && aquariumId),
  });

  const [selected, setSelected] = useState<Record<string, string>>({});

  const items = tpQ.data?.items ?? [];

  const m = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<WaterTest>(`/aquariums/${id}/water-tests`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    onSuccess: async () => {
      nav(`/aquariums/${id}`);
    },
  });

  function toggle(pid: string, enabled: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      if (enabled) next[pid] = next[pid] ?? '';
      else delete next[pid];
      return next;
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const notesRaw = fd.get('notes');
    const results = Object.entries(selected)
      .map(([testParameterId, v]) => ({ testParameterId, value: Number(v) }))
      .filter((r) => Number.isFinite(r.value));

    if (results.length === 0) {
      alert('Informe ao menos um parâmetro marcado com valor válido.');
      return;
    }

    m.mutate({
      notes: typeof notesRaw === 'string' && notesRaw.length > 0 ? notesRaw : null,
      results,
    });
  }

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link className="text-sm text-sky-700 hover:underline" to={`/aquariums/${id}`}>
          ← Voltar ao aquário
        </Link>
        <h2 className="mt-4 text-2xl font-semibold">Novo teste de água</h2>
        <p className="text-sm text-slate-600">
          Escolha quais parâmetros mediu e informe os valores. Faixas ideais dependem do tipo de água do aquário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros ({selectedCount} selecionados)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="Opcional" />
            </div>

            <div className="space-y-3">
              {items.map((tp) => {
                const on = Object.prototype.hasOwnProperty.call(selected, tp.id);
                return (
                  <div key={tp.id} className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 p-3">
                    <label className="flex min-w-[180px] flex-1 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(ev) => toggle(tp.id, ev.target.checked)}
                      />
                      <span>
                        <strong>{tp.name}</strong> <span className="text-slate-500">({tp.unit})</span>
                      </span>
                    </label>
                    <Input
                      className="w-32"
                      inputMode="decimal"
                      placeholder="Valor"
                      value={selected[tp.id] ?? ''}
                      disabled={!on}
                      onChange={(ev) =>
                        setSelected((prev) => ({ ...prev, [tp.id]: ev.target.value }))
                      }
                    />
                  </div>
                );
              })}
            </div>

            {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}

            <Button type="submit" disabled={m.isPending}>
              Salvar teste
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
