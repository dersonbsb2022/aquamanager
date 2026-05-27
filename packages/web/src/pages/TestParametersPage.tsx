import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type { Paginated, TestParameter } from '../types/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';

type Row = Pick<TestParameter, 'id' | 'name' | 'unit' | 'description'>;

export function TestParametersPage() {
  const { token } = useAuth();
  const q = useQuery({
    queryKey: ['test-parameters', 'admin'],
    queryFn: () => apiFetch<Paginated<TestParameter>>(`/test-parameters?page=1&perPage=100`, { token }),
    enabled: Boolean(token),
  });

  const createM = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<TestParameter>('/test-parameters', { method: 'POST', body: JSON.stringify(payload), token }),
    onSuccess: async () => {
      await q.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link className="text-sm text-sky-700 hover:underline" to="/">
          ← Dashboard
        </Link>
        <h2 className="mt-4 text-2xl font-semibold">Parâmetros de teste</h2>
        <p className="text-sm text-slate-600">CRUD de referência utilizado nos testes de água</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo parâmetro</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const desc = fd.get('description');
              createM.mutate({
                name: String(fd.get('name')),
                unit: String(fd.get('unit')),
                description:
                  typeof desc === 'string' && desc.trim().length > 0 ? desc.trim() : null,
              });
              e.currentTarget.reset();
            }}
          >
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input name="unit" required />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Descrição</Label>
              <Input name="description" />
            </div>
            {createM.isError ? <p className="md:col-span-3 text-sm text-red-600">{(createM.error as Error).message}</p> : null}
            <div className="md:col-span-3">
              <Button type="submit" size="sm" disabled={createM.isPending}>
                Criar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? <p className="text-sm text-slate-600">Carregando…</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Descrição</TableHead>
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
  row: Row;
  token: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [unit, setUnit] = useState(row.unit);
  const [description, setDescription] = useState(row.description ?? '');

  useEffect(() => {
    setName(row.name);
    setUnit(row.unit);
    setDescription(row.description ?? '');
  }, [row]);

  const m = useMutation({
    mutationFn: () =>
      apiFetch<TestParameter>(`/test-parameters/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          unit,
          description: description.trim().length > 0 ? description.trim() : null,
        }),
        token,
      }),
    onSuccess: async () => {
      onSaved();
    },
  });

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </TableCell>
      <TableCell>
        <Button type="button" size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate()}>
          Salvar
        </Button>
      </TableCell>
    </TableRow>
  );
}
