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
import { defaultDatetimeLocal, parseDatetimeLocal } from '../lib/datetimeLocal.js';

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
  const [testedAtLocal, setTestedAtLocal] = useState(defaultDatetimeLocal);

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

    const testedAtParsed = parseDatetimeLocal(testedAtLocal);
    if (!testedAtParsed) {
      alert('Data e hora do teste inválidas.');
      return;
    }

    m.mutate({
      testedAt: testedAtParsed.toISOString(),
      notes: typeof notesRaw === 'string' && notesRaw.length > 0 ? notesRaw : null,
      results,
    });
  }

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" to={`/aquariums/${id}`}>
          ← Voltar ao aquário
        </Link>
        <h2 className="mt-4 text-2xl font-semibold">Novo teste de água</h2>
        <p className="text-sm text-muted-foreground">
          Escolha quais parâmetros mediu e informe os valores. Use a data em que o teste foi feito — o histórico e
          os gráficos usam essa data, não o dia em que você lança no app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros ({selectedCount} selecionados)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
              <Label htmlFor="testedAt">Quando o teste foi feito</Label>
              <Input
                id="testedAt"
                name="testedAt"
                type="datetime-local"
                required
                value={testedAtLocal}
                onChange={(e) => setTestedAtLocal(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Padrão: agora. Ajuste se mediu em outro dia e está lançando depois.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="Opcional" />
            </div>

            <div className="space-y-3">
              {items.map((tp) => {
                const on = Object.prototype.hasOwnProperty.call(selected, tp.id);
                return (
                  <div key={tp.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                    <label className="flex min-w-[180px] flex-1 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(ev) => toggle(tp.id, ev.target.checked)}
                      />
                      <span>
                        <strong>{tp.name}</strong> <span className="text-muted-foreground">({tp.unit})</span>
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
