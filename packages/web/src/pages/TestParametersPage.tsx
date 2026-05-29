import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type { Paginated, TestParameter } from '../types/api.js';
import { ParameterRangesFields } from '../components/ParameterRangesFields.js';
import { DeleteIconButton, RowActions, RowIconButton } from '../components/row-actions.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import {
  emptyRangeInputs,
  formatRangesSummary,
  parseRangeInputs,
  rangesFromParameter,
  type ParameterRangeInput,
} from '../lib/waterTypes.js';

export function TestParametersPage() {
  const { token } = useAuth();
  const [createRanges, setCreateRanges] = useState<ParameterRangeInput[]>(emptyRangeInputs);

  const q = useQuery({
    queryKey: ['test-parameters', 'admin'],
    queryFn: () => apiFetch<Paginated<TestParameter>>(`/test-parameters?page=1&perPage=100`, { token }),
    enabled: Boolean(token),
  });

  const createM = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<TestParameter>('/test-parameters', { method: 'POST', body: JSON.stringify(payload), token }),
    onSuccess: async () => {
      setCreateRanges(emptyRangeInputs());
      await q.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" to="/">
          ← Dashboard
        </Link>
        <h2 className="mt-4 text-2xl font-semibold">Parâmetros de teste</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre nome, unidade e faixas ideais (mín./máx.) por tipo de água — usadas nos alertas do
          aquário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo parâmetro</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              try {
                const fd = new FormData(e.currentTarget);
                const desc = fd.get('description');
                createM.mutate({
                  name: String(fd.get('name')),
                  unit: String(fd.get('unit')),
                  description:
                    typeof desc === 'string' && desc.trim().length > 0 ? desc.trim() : null,
                  ranges: parseRangeInputs(createRanges),
                });
                e.currentTarget.reset();
              } catch (err) {
                createM.reset();
                alert(err instanceof Error ? err.message : 'Dados inválidos');
              }
            }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input name="name" required placeholder="Ex: Nitrito (NO2)" />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input name="unit" required placeholder="Ex: ppm" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Descrição</Label>
                <Input name="description" placeholder="Opcional" />
              </div>
            </div>
            <ParameterRangesFields ranges={createRanges} onChange={setCreateRanges} />
            {createM.isError ? (
              <p className="text-sm text-red-600">{(createM.error as Error).message}</p>
            ) : null}
            <Button type="submit" size="sm" disabled={createM.isPending}>
              Criar parâmetro
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Faixas ideais</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data?.items ?? []).map((row) => (
                <EditableRow key={row.id} row={row} token={token} onSaved={() => void q.refetch()} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EditableRow({
  row,
  token,
  onSaved,
}: {
  row: TestParameter;
  token: string | null;
  onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(row.name);
  const [unit, setUnit] = useState(row.unit);
  const [description, setDescription] = useState(row.description ?? '');
  const [rangeInputs, setRangeInputs] = useState<ParameterRangeInput[]>(() => rangesFromParameter(row.ranges));

  useEffect(() => {
    setName(row.name);
    setUnit(row.unit);
    setDescription(row.description ?? '');
    setRangeInputs(rangesFromParameter(row.ranges));
  }, [row]);

  const m = useMutation({
    mutationFn: () => {
      const ranges = parseRangeInputs(rangeInputs);
      return apiFetch<TestParameter>(`/test-parameters/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          unit,
          description: description.trim().length > 0 ? description.trim() : null,
          ranges,
        }),
        token,
      });
    },
    onSuccess: async () => {
      setExpanded(false);
      onSaved();
    },
  });

  function save() {
    try {
      m.mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Dados inválidos');
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </TableCell>
        <TableCell>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </TableCell>
        <TableCell className="max-w-xs text-xs text-muted-foreground">
          {formatRangesSummary(row.ranges)}
        </TableCell>
        <TableCell>
          <RowActions>
            <RowIconButton
              variant="edit"
              title="Editar faixas ideais"
              onClick={() => setExpanded((v) => !v)}
            />
            <RowIconButton variant="save" title="Salvar" loading={m.isPending} onClick={save} />
            <DeleteIconButton
              title="Excluir parâmetro"
              confirmMessage={`Excluir o parâmetro "${row.name}"?\n\nSó é possível se nunca foi usado em um teste.`}
              deleteFn={() => apiFetch<void>(`/test-parameters/${row.id}`, { method: 'DELETE', token })}
              onSuccess={onSaved}
            />
          </RowActions>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/20">
            <div className="space-y-3 py-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              <ParameterRangesFields ranges={rangeInputs} onChange={setRangeInputs} compact />
              <p className="text-xs text-muted-foreground">
                Ao salvar, os testes antigos deste parâmetro são reavaliados com as novas faixas.
              </p>
              <Button type="button" size="sm" onClick={save} disabled={m.isPending}>
                Salvar faixas e dados
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
