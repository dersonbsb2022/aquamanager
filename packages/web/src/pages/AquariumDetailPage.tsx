import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type {
  Animal,
  AquariumListItem,
  Dosing,
  Equipment,
  Paginated,
  TestParameter,
  WaterChange,
  WaterTest,
  WaterType,
  AccessToken,
} from '../types/api.js';
import { WaterParameterChart } from '../components/WaterParameterChart.js';
import { AquariumInfoPanel } from '../components/AquariumInfoPanel.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.js';

type AquariumDetailApi = Omit<AquariumListItem, 'lastWaterTest'> & {
  photoUrl: string | null;
  targetTempMin: number | null;
  targetTempMax: number | null;
  aliveQuantity?: number;
  lastWaterTest: WaterTest | null;
};

function waterLabel(w: WaterType | string) {
  if (w === 'FRESHWATER') return 'Doce';
  if (w === 'SALTWATER') return 'Salgada';
  if (w === 'BRACKISH') return 'Salobra';
  return String(w);
}

export function AquariumDetailPage() {
  const { aquariumId } = useParams<{ aquariumId: string }>();
  const { token } = useAuth();
  const id = aquariumId!;
  const [paramName, setParamName] = useState('pH');

  const detailQ = useQuery({
    queryKey: ['aquarium', id],
    queryFn: () => apiFetch<AquariumDetailApi>(`/aquariums/${id}`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const animalsQ = useQuery({
    queryKey: ['aquarium', id, 'animals'],
    queryFn: () => apiFetch<Paginated<Animal>>(`/aquariums/${id}/animals?page=1&perPage=50`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const testsQ = useQuery({
    queryKey: ['aquarium', id, 'water-tests'],
    queryFn: () =>
      apiFetch<Paginated<WaterTest>>(`/aquariums/${id}/water-tests?page=1&perPage=50`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const tpQ = useQuery({
    queryKey: ['test-parameters'],
    queryFn: () =>
      apiFetch<Paginated<TestParameter>>(`/test-parameters?page=1&perPage=100`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const histQ = useQuery({
    queryKey: ['aquarium', id, 'history', paramName],
    queryFn: () =>
      apiFetch<{
        points: { testedAt: string; value: number; isWithinRange: boolean | null }[];
        idealRange: { idealMin: number | null; idealMax: number | null } | null;
      }>(`/aquariums/${id}/water-tests/history?parameter=${encodeURIComponent(paramName)}`, {
        token,
      }),
    enabled: Boolean(token && aquariumId && paramName),
  });

  const changesQ = useQuery({
    queryKey: ['aquarium', id, 'changes'],
    queryFn: () =>
      apiFetch<Paginated<WaterChange>>(`/aquariums/${id}/water-changes?page=1&perPage=50`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const equipQ = useQuery({
    queryKey: ['aquarium', id, 'equips'],
    queryFn: () =>
      apiFetch<Paginated<Equipment>>(`/aquariums/${id}/equipments?page=1&perPage=50`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const dosingQ = useQuery({
    queryKey: ['aquarium', id, 'dosings'],
    queryFn: () =>
      apiFetch<Paginated<Dosing>>(`/aquariums/${id}/dosings?page=1&perPage=50`, { token }),
    enabled: Boolean(token && aquariumId),
  });

  const summary = useMemo(() => {
    const aqData = detailQ.data;
    if (!aqData?.lastWaterTest) return [];
    return aqData.lastWaterTest.results.slice(0, 8);
  }, [detailQ.data]);

  const aq = detailQ.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{aq?.name ?? 'Aquário'}</h2>
            {!aq?.isActive ? <Badge variant="warning">Inativo</Badge> : null}
          </div>
          {aq ? (
            <p className="text-sm text-slate-600">
              {aq.volumeLiters} L · {waterLabel(aq.waterType)} · fauna viva:{' '}
              {aq.aliveQuantity ?? '—'} indivíduos (soma)
            </p>
          ) : null}
          <Link className="text-sm text-sky-700 hover:underline" to="/">
            ← Voltar ao painel
          </Link>
        </div>
        <Link to={`/aquariums/${id}/water-tests/new`}>
          <Button>Novo teste de água</Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="animals">Animais</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="changes">TPAs</TabsTrigger>
          <TabsTrigger value="equip">Equipamentos</TabsTrigger>
          <TabsTrigger value="dosing">Dosagens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {aq ? <AquariumInfoPanel aquarium={aq} token={token} /> : null}

            <Card>
              <CardHeader>
                <CardTitle>Último teste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {detailQ.data?.lastWaterTest ? (
                  <>
                    <p className="text-slate-600">
                      {new Date(detailQ.data.lastWaterTest.testedAt).toLocaleString('pt-BR')}
                    </p>
                    <ul className="space-y-2">
                      {summary.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-4">
                          <span>
                            {r.testParameter.name} ({r.testParameter.unit})
                          </span>
                          <Badge
                            variant={
                              r.isWithinRange === false
                                ? 'warning'
                                : r.isWithinRange === true
                                  ? 'success'
                                  : 'default'
                            }
                          >
                            {r.value}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>Nenhum teste registrado ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="animals">
          <Card>
            <CardHeader>
              <CardTitle>Fauna registrada</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimalQuickForm aquariumId={id} token={token} />
              {animalsQ.isLoading ? <p className="text-sm text-slate-600 mb-4">Carregando…</p> : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Popular</TableHead>
                    <TableHead>Científico</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(animalsQ.data?.items ?? []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.commonName}</TableCell>
                      <TableCell className="text-slate-600">{a.speciesName}</TableCell>
                      <TableCell>{a.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'ALIVE' ? 'success' : 'default'}>{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Histórico e tendência por parâmetro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label>Parâmetro</Label>
                  <select
                    className="h-9 min-w-[240px] rounded-md border border-slate-200 bg-white px-2 text-sm"
                    value={paramName}
                    onChange={(e) => setParamName(e.target.value)}
                  >
                    {(tpQ.data?.items ?? []).map((tp) => (
                      <option key={tp.id} value={tp.name}>
                        {tp.name} ({tp.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <WaterParameterChart
                points={histQ.data?.points ?? []}
                idealMin={histQ.data?.idealRange?.idealMin ?? null}
                idealMax={histQ.data?.idealRange?.idealMax ?? null}
              />

              <h3 className="pt-6 text-sm font-medium text-slate-800">Últimos testes</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Resultados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(testsQ.data?.items ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.testedAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-slate-600">
                        {t.results.slice(0, 8).map((r) => (
                          <span key={r.id} className="mr-3 inline-block">
                            <strong>{r.testParameter.name}:</strong> {r.value}
                          </span>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle>Trocas parciais (TPAs)</CardTitle>
            </CardHeader>
            <CardContent>
              <TpaQuickForm aquariumId={id} token={token} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Volume (L)</TableHead>
                    <TableHead>% Aquário</TableHead>
                    <TableHead>Declorador?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(changesQ.data?.items ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.changedAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{c.volumeLiters}</TableCell>
                      <TableCell>
                        {c.percentVolume != null ? `${c.percentVolume.toFixed(1)}%` : '—'}
                      </TableCell>
                      <TableCell>{c.usedDechlorinator ? 'Sim' : 'Não'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equip">
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos e manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EquipmentQuickForm aquariumId={id} token={token} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Marca / modelo</TableHead>
                    <TableHead>Próxima manutenção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(equipQ.data?.items ?? []).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.type}</TableCell>
                      <TableCell>
                        {e.brand ?? ''} {e.model ?? ''}
                      </TableCell>
                      <TableCell>
                        {e.nextMaintenanceAt ? new Date(e.nextMaintenanceAt).toLocaleDateString('pt-BR') : '—'}{' '}
                        {e.nextMaintenanceAt && new Date(e.nextMaintenanceAt).getTime() <= Date.now() ? (
                          <Badge variant="warning" className="ml-2">
                            vencido
                          </Badge>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dosing">
          <Card>
            <CardHeader>
              <CardTitle>Dosagens</CardTitle>
            </CardHeader>
            <CardContent>
              <DosingQuickForm aquariumId={id} token={token} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>ml</TableHead>
                    <TableHead>Finalidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dosingQ.data?.items ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{new Date(d.dosedAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{d.productName}</TableCell>
                      <TableCell>{d.amountMl}</TableCell>
                      <TableCell>{d.purpose ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnimalQuickForm({ aquariumId, token }: { aquariumId: string; token: AccessToken | null }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Animal>(`/aquariums/${aquariumId}/animals`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId] });
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'animals'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    m.mutate({
      commonName: String(fd.get('commonName')),
      speciesName: String(fd.get('speciesName')),
      quantity: Number(fd.get('quantity')),
    });
  }

  return (
    <form className="mb-6 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Nome popular</Label>
        <Input name="commonName" required />
      </div>
      <div className="space-y-2">
        <Label>Espécie (científico)</Label>
        <Input name="speciesName" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Quantidade</Label>
        <Input name="quantity" type="number" min={1} step={1} defaultValue={1} required />
      </div>
      {m.isError ? <p className="md:col-span-2 text-sm text-red-600">{(m.error as Error).message}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" size="sm" disabled={m.isPending}>
          Adicionar
        </Button>
      </div>
    </form>
  );
}

function TpaQuickForm({ aquariumId, token }: { aquariumId: string; token: AccessToken | null }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<WaterChange>(`/aquariums/${aquariumId}/water-changes`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'changes'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    m.mutate({
      volumeLiters: Number(fd.get('volumeLiters')),
      usedDechlorinator: fd.get('usedDechlorinator') === 'on',
    });
  }

  return (
    <form className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Volume trocado (L)</Label>
        <Input name="volumeLiters" type="number" min={0.01} step="0.01" required className="w-44" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 pt-8">
        <input name="usedDechlorinator" type="checkbox" className="h-4 w-4 rounded border-slate-300" /> declorador
      </label>
      {m.isError ? <p className="w-full text-sm text-red-600">{(m.error as Error).message}</p> : null}
      <Button type="submit" size="sm" disabled={m.isPending}>
        Registrar TPA
      </Button>
    </form>
  );
}

function EquipmentQuickForm({ aquariumId, token }: { aquariumId: string; token: AccessToken | null }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Equipment>(`/aquariums/${aquariumId}/equipments`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'equips'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    m.mutate({ type: String(fd.get('type')) });
  }

  return (
    <form className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <select name="type" className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" required defaultValue="FILTER">
          <option value="FILTER">FILTRO</option>
          <option value="HEATER">AQUECEDOR</option>
          <option value="LIGHT">ILUMINAÇÃO</option>
          <option value="CO2">CO2</option>
          <option value="PUMP">BOMBA</option>
          <option value="SKIMMER">SKIMMER</option>
          <option value="UV_STERILIZER">UV</option>
          <option value="OTHER">OUTRO</option>
        </select>
      </div>
      {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
      <Button type="submit" size="sm" disabled={m.isPending}>
        Adicionar equipamento
      </Button>
    </form>
  );
}

function DosingQuickForm({ aquariumId, token }: { aquariumId: string; token: AccessToken | null }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Dosing>(`/aquariums/${aquariumId}/dosings`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'dosings'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const purpose = fd.get('purpose');
    m.mutate({
      productName: String(fd.get('productName')),
      amountMl: Number(fd.get('amountMl')),
      purpose: typeof purpose === 'string' && purpose.length > 0 ? purpose : null,
    });
  }

  return (
    <form className="mb-6 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2 md:col-span-2">
        <Label>Produto</Label>
        <Input name="productName" required />
      </div>
      <div className="space-y-2">
        <Label>Volume (ml)</Label>
        <Input name="amountMl" type="number" step="0.01" min={0.01} required />
      </div>
      <div className="space-y-2">
        <Label>Finalidade (opcional)</Label>
        <Input name="purpose" placeholder="Condicionador, fertilização…" />
      </div>
      {m.isError ? <p className="md:col-span-2 text-sm text-red-600">{(m.error as Error).message}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" size="sm" disabled={m.isPending}>
          Registrar dosagem
        </Button>
      </div>
    </form>
  );
}
