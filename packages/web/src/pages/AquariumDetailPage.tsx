import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch, apiUpload } from '../services/api.js';
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
import { WaterTestSnapshotChart } from '../components/WaterTestSnapshotChart.js';
import { WaterTestTrendChart } from '../components/WaterTestTrendChart.js';
import { WaterTestDeleteButton } from '../components/WaterTestDeleteButton.js';
import { AnimalEditDialog } from '../components/AnimalEditDialog.js';
import { AnimalViewDialog } from '../components/AnimalViewDialog.js';
import { Archive, DeleteIconButton, RowActions, RowIconButton } from '../components/row-actions.js';
import { AquariumInfoPanel } from '../components/AquariumInfoPanel.js';
import { AquariumPhoto } from '../components/AquariumPhoto.js';
import { EntityThumbnail } from '../components/EntityThumbnail.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.js';
import { defaultDatetimeLocal, parseDatetimeLocal } from '../lib/datetimeLocal.js';
import { litersFromTpaPercent, tpaPercentOfAquarium } from '../lib/tpaVolume.js';

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
  const nav = useNavigate();
  const qc = useQueryClient();
  const id = aquariumId!;
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [paramFilter, setParamFilter] = useState('');

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

  const tests = useMemo(() => testsQ.data?.items ?? [], [testsQ.data?.items]);

  useEffect(() => {
    if (tests.length === 0) {
      setSelectedTestId(null);
      return;
    }
    if (!selectedTestId || !tests.some((t) => t.id === selectedTestId)) {
      setSelectedTestId(tests[0].id);
    }
  }, [tests, selectedTestId]);

  const selectedTest = useMemo(
    () => tests.find((t) => t.id === selectedTestId) ?? null,
    [tests, selectedTestId],
  );

  const paramFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const t of tests) {
      for (const r of t.results) names.add(r.testParameter.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [tests]);

  useEffect(() => {
    if (paramFilter && selectedTest && !selectedTest.results.some((r) => r.testParameter.name === paramFilter)) {
      setParamFilter('');
    }
  }, [selectedTestId, selectedTest, paramFilter]);

  const histQ = useQuery({
    queryKey: ['aquarium', id, 'history', paramFilter],
    queryFn: () =>
      apiFetch<{
        points: { testedAt: string; value: number; isWithinRange: boolean | null }[];
        idealRange: { idealMin: number | null; idealMax: number | null } | null;
      }>(`/aquariums/${id}/water-tests/history?parameter=${encodeURIComponent(paramFilter)}`, {
        token,
      }),
    enabled: Boolean(token && aquariumId && paramFilter),
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
          <div className="flex flex-wrap items-center gap-3">
            {aq ? <AquariumPhoto src={aq.photoUrl} name={aq.name} variant="inline" /> : null}
            <h2 className="text-2xl font-semibold">{aq?.name ?? 'Aquário'}</h2>
            {!aq?.isActive ? <Badge variant="warning">Inativo</Badge> : null}
          </div>
          {aq ? (
            <p className="text-sm text-muted-foreground">
              {aq.volumeLiters} L · {waterLabel(aq.waterType)} · fauna viva:{' '}
              {aq.aliveQuantity ?? '—'} indivíduos (soma)
            </p>
          ) : null}
          <Link className="text-sm text-primary hover:underline" to="/">
            ← Voltar ao painel
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/aquariums/${id}/water-tests/new`}>
            <Button>Novo teste de água</Button>
          </Link>
          {aq?.isActive ? (
            <DeleteIconButton
              icon={Archive}
              title="Arquivar aquário"
              confirmMessage={`Arquivar o aquário "${aq.name}"?\n\nEle deixa de aparecer no painel. Testes, animais e histórico permanecem guardados.`}
              deleteFn={() => apiFetch<void>(`/aquariums/${id}`, { method: 'DELETE', token })}
              onSuccess={async () => {
                await qc.invalidateQueries({ queryKey: ['aquariums'] });
                nav('/');
              }}
            />
          ) : null}
        </div>
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
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <CardTitle>Último teste</CardTitle>
                {detailQ.data?.lastWaterTest ? (
                  <WaterTestDeleteButton test={detailQ.data.lastWaterTest} aquariumId={id} token={token} />
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {detailQ.data?.lastWaterTest ? (
                  <>
                    <p className="text-muted-foreground">
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
              {animalsQ.isLoading ? <p className="text-sm text-muted-foreground mb-4">Carregando…</p> : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome popular</TableHead>
                    <TableHead>Científico</TableHead>
                    <TableHead>Entrou em</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(animalsQ.data?.items ?? []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="min-w-[12rem]">
                        <span className="flex items-center gap-2">
                          <EntityThumbnail src={a.photoUrl} fallbackLabel={a.commonName} className="h-9 w-9" rounded="full" />
                          <span className="truncate font-medium">{a.commonName}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.speciesName}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(a.addedDate).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{a.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'ALIVE' ? 'success' : 'default'}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <AnimalRowActions animal={a} aquariumId={id} token={token} />
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
              <CardTitle>Resultados dos testes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="paramFilter">Parâmetro</Label>
                  <select
                    id="paramFilter"
                    className="h-9 min-w-[240px] rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    value={paramFilter}
                    onChange={(e) => setParamFilter(e.target.value)}
                  >
                    <option value="">Todos os parâmetros</option>
                    {paramFilterOptions.map((name) => {
                      const tp = (tpQ.data?.items ?? []).find((p) => p.name === name);
                      return (
                        <option key={name} value={name}>
                          {name}
                          {tp?.unit ? ` (${tp.unit})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <WaterTestSnapshotChart
                test={selectedTest}
                parameterFilter={paramFilter}
                waterType={aq?.waterType}
                parameterCatalog={tpQ.data?.items ?? []}
              />

              {paramFilter && histQ.data ? (
                <WaterTestTrendChart
                  points={histQ.data.points}
                  idealMin={histQ.data.idealRange?.idealMin ?? null}
                  idealMax={histQ.data.idealRange?.idealMax ?? null}
                  parameterName={paramFilter}
                  highlightTestedAt={selectedTest?.testedAt ?? null}
                />
              ) : null}

              <div className="space-y-3 border-t border-border pt-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Testes registrados</h3>
                  <p className="text-xs text-muted-foreground">
                    Clique em um teste para visualizar no gráfico. O mais recente é selecionado automaticamente.
                  </p>
                </div>
                <WaterTestsTable
                  aquariumId={id}
                  tests={tests}
                  token={token}
                  selectedTestId={selectedTestId}
                  onSelectTest={setSelectedTestId}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle>Trocas parciais (TPAs)</CardTitle>
            </CardHeader>
            <CardContent>
              <TpaQuickForm aquariumId={id} aquariumVolumeLiters={aq?.volumeLiters} token={token} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Volume (L)</TableHead>
                    <TableHead>% do aquário</TableHead>
                    <TableHead>Declorador?</TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(changesQ.data?.items ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.changedAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{c.volumeLiters}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.percentVolume != null ? (
                          <span title={`${c.volumeLiters} L ÷ volume do aquário`}>
                            {c.percentVolume.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{c.usedDechlorinator ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="text-right">
                        <RowActions>
                          <DeleteIconButton
                            confirmMessage={`Excluir a TPA de ${new Date(c.changedAt).toLocaleString('pt-BR')}?\n\nEsta ação não pode ser desfeita.`}
                            deleteFn={() => apiFetch<void>(`/water-changes/${c.id}`, { method: 'DELETE', token })}
                            onSuccess={() => qc.invalidateQueries({ queryKey: ['aquarium', id, 'changes'] })}
                          />
                        </RowActions>
                      </TableCell>
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
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Ações</TableHead>
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
                      <TableCell className="text-right">
                        <RowActions>
                          <DeleteIconButton
                            confirmMessage={`Excluir este equipamento (${e.type})?\n\nEsta ação não pode ser desfeita.`}
                            deleteFn={() => apiFetch<void>(`/equipments/${e.id}`, { method: 'DELETE', token })}
                            onSuccess={() => qc.invalidateQueries({ queryKey: ['aquarium', id, 'equips'] })}
                          />
                        </RowActions>
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
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dosingQ.data?.items ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{new Date(d.dosedAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{d.productName}</TableCell>
                      <TableCell>{d.amountMl}</TableCell>
                      <TableCell>{d.purpose ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <RowActions>
                          <DeleteIconButton
                            confirmMessage={`Excluir dosagem de ${d.productName} (${new Date(d.dosedAt).toLocaleString('pt-BR')})?\n\nEsta ação não pode ser desfeita.`}
                            deleteFn={() => apiFetch<void>(`/dosings/${d.id}`, { method: 'DELETE', token })}
                            onSuccess={() => qc.invalidateQueries({ queryKey: ['aquarium', id, 'dosings'] })}
                          />
                        </RowActions>
                      </TableCell>
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

function WaterTestsTable({
  aquariumId,
  tests,
  token,
  selectedTestId,
  onSelectTest,
}: {
  aquariumId: string;
  tests: WaterTest[];
  token: AccessToken | null;
  selectedTestId: string | null;
  onSelectTest: (id: string) => void;
}) {
  if (tests.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum teste registrado ainda.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Quando</TableHead>
          <TableHead>Resultados</TableHead>
          <TableHead className="w-[1%] whitespace-nowrap text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map((t) => {
          const selected = t.id === selectedTestId;
          return (
            <TableRow
              key={t.id}
              className={`cursor-pointer ${selected ? 'bg-primary/10 hover:bg-primary/15' : ''}`}
              onClick={() => onSelectTest(t.id)}
            >
              <TableCell className="whitespace-nowrap">
                {selected ? <span className="mr-2 text-primary">●</span> : null}
                {new Date(t.testedAt).toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t.results.slice(0, 8).map((r) => (
                  <span key={r.id} className="mr-3 inline-block">
                    <strong className="text-foreground">{r.testParameter.name}:</strong> {r.value}
                  </span>
                ))}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <RowActions>
                  <WaterTestDeleteButton test={t} aquariumId={aquariumId} token={token} />
                </RowActions>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function AnimalRowActions({
  animal,
  aquariumId,
  token,
}: {
  animal: Animal;
  aquariumId: string;
  token: AccessToken | null;
}) {
  const qc = useQueryClient();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <RowActions>
        <RowIconButton variant="neutral" icon={Eye} title="Visualizar animal" onClick={() => setViewOpen(true)} />
        <RowIconButton title="Editar animal" onClick={() => setEditOpen(true)} />
        <DeleteIconButton
          title="Excluir animal"
          confirmMessage={`Excluir ${animal.commonName} do registro?\n\nEsta ação não pode ser desfeita.`}
          deleteFn={() => apiFetch<void>(`/animals/${animal.id}`, { method: 'DELETE', token })}
          onSuccess={async () => {
            await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId] });
            await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'animals'] });
          }}
        />
      </RowActions>
      <AnimalViewDialog
        animal={animal}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={() => {
          setViewOpen(false);
          setEditOpen(true);
        }}
      />
      <AnimalEditDialog
        animal={animal}
        aquariumId={aquariumId}
        token={token}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}

function AnimalQuickForm({ aquariumId, token }: { aquariumId: string; token: AccessToken | null }) {
  const qc = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [addedAtLocal, setAddedAtLocal] = useState(defaultDatetimeLocal);

  const m = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const animal = await apiFetch<Animal>(`/aquariums/${aquariumId}/animals`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      });
      if (photoFile) {
        await apiUpload(`/animals/${animal.id}/photo`, photoFile, { token });
      }
      return animal;
    },
    onSuccess: async () => {
      setPhotoFile(null);
      setAddedAtLocal(defaultDatetimeLocal());
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId] });
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'animals'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const addedDate = parseDatetimeLocal(addedAtLocal);
    if (!addedDate) {
      alert('Data de entrada inválida.');
      return;
    }
    m.mutate({
      commonName: String(fd.get('commonName')),
      speciesName: String(fd.get('speciesName')),
      quantity: Number(fd.get('quantity')),
      addedDate: addedDate.toISOString(),
    });
  }

  return (
    <form className="mb-6 grid gap-4 rounded-lg border border-border bg-muted/40 p-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="animalAddedAt">Quando entrou no aquário</Label>
        <Input
          id="animalAddedAt"
          type="datetime-local"
          required
          value={addedAtLocal}
          onChange={(e) => setAddedAtLocal(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">Use a data real da introdução, não só o dia do lançamento no app.</p>
      </div>
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
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="animalPhotoNew">Foto (opcional)</Label>
        <Input
          id="animalPhotoNew"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
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

type TpaInputMode = 'liters' | 'percent';

function TpaQuickForm({
  aquariumId,
  aquariumVolumeLiters,
  token,
}: {
  aquariumId: string;
  aquariumVolumeLiters?: number;
  token: AccessToken | null;
}) {
  const qc = useQueryClient();
  const [changedAtLocal, setChangedAtLocal] = useState(defaultDatetimeLocal);
  const [inputMode, setInputMode] = useState<TpaInputMode>('liters');
  const [amountDraft, setAmountDraft] = useState('');

  const volAquario = aquariumVolumeLiters ?? 0;
  const amountNum = amountDraft.trim() === '' ? NaN : Number(amountDraft);
  const previewLiters =
    inputMode === 'liters'
      ? amountNum
      : litersFromTpaPercent(amountNum, volAquario) ?? NaN;
  const previewPercent =
    inputMode === 'percent'
      ? amountNum
      : tpaPercentOfAquarium(amountNum, volAquario);

  const m = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<WaterChange>(`/aquariums/${aquariumId}/water-changes`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    onSuccess: async () => {
      setChangedAtLocal(defaultDatetimeLocal());
      setAmountDraft('');
      await qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'changes'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const changedAt = parseDatetimeLocal(changedAtLocal);
    if (!changedAt) {
      alert('Data da TPA inválida.');
      return;
    }
    if (!Number.isFinite(volAquario) || volAquario <= 0) {
      alert('Cadastre o volume do aquário (em litros) para registrar TPAs.');
      return;
    }

    let volumeLiters: number;
    if (inputMode === 'liters') {
      volumeLiters = Number(fd.get('tpaAmount'));
    } else {
      const pct = Number(fd.get('tpaAmount'));
      const liters = litersFromTpaPercent(pct, volAquario);
      if (liters == null) {
        alert('Informe um percentual válido.');
        return;
      }
      volumeLiters = liters;
    }

    if (!Number.isFinite(volumeLiters) || volumeLiters <= 0) {
      alert('Informe um volume válido.');
      return;
    }

    m.mutate({
      changedAt: changedAt.toISOString(),
      volumeLiters,
      usedDechlorinator: fd.get('usedDechlorinator') === 'on',
    });
  }

  return (
    <form className="mb-6 space-y-4 rounded-lg border border-border bg-muted/40 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="tpaChangedAt">Quando a TPA foi feita</Label>
        <Input
          id="tpaChangedAt"
          type="datetime-local"
          required
          value={changedAtLocal}
          onChange={(e) => setChangedAtLocal(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">O histórico usa esta data, não o dia em que você registra aqui.</p>
      </div>

      {volAquario > 0 ? (
        <p className="text-xs text-muted-foreground">
          Volume do aquário: <strong>{volAquario} L</strong>. O % na tabela é sempre{' '}
          <strong>litros trocados ÷ volume total</strong> (ex.: 10 L em 55 L = 18,2%, não 10%).
        </p>
      ) : (
        <p className="text-xs text-amber-800">Defina o volume do aquário nas informações para calcular o % da TPA.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
            inputMode === 'liters' ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'
          }`}
          onClick={() => {
            setInputMode('liters');
            setAmountDraft('');
          }}
        >
          Informar em litros
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
            inputMode === 'percent' ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'
          }`}
          onClick={() => {
            setInputMode('percent');
            setAmountDraft('');
          }}
        >
          Informar em % do aquário
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="tpaAmount">
            {inputMode === 'liters' ? 'Volume trocado (L)' : '% do volume do aquário'}
          </Label>
          <Input
            id="tpaAmount"
            name="tpaAmount"
            type="number"
            min={inputMode === 'percent' ? 0.1 : 0.01}
            max={inputMode === 'percent' ? 100 : undefined}
            step={inputMode === 'percent' ? 0.1 : 0.01}
            required
            className="w-40"
            value={amountDraft}
            onChange={(e) => setAmountDraft(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
          <input name="usedDechlorinator" type="checkbox" className="h-4 w-4 rounded border-border" /> declorador
        </label>
        <Button type="submit" size="sm" disabled={m.isPending || volAquario <= 0}>
          Registrar TPA
        </Button>
      </div>

      {Number.isFinite(previewLiters) && previewLiters > 0 && Number.isFinite(previewPercent) ? (
        <p className="text-sm text-muted-foreground">
          {inputMode === 'liters' ? (
            <>
              <strong>{previewLiters} L</strong> em um aquário de <strong>{volAquario} L</strong> ≈{' '}
              <strong>{previewPercent.toFixed(1)}%</strong> do volume.
            </>
          ) : (
            <>
              <strong>{amountNum}%</strong> de <strong>{volAquario} L</strong> ≈ <strong>{previewLiters.toFixed(1)} L</strong>{' '}
              trocados.
            </>
          )}
        </p>
      ) : null}

      {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
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
    <form className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-muted/40 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <select name="type" className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground" required defaultValue="FILTER">
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
    <form className="mb-6 grid gap-4 rounded-lg border border-border bg-muted/40 p-4 md:grid-cols-2" onSubmit={onSubmit}>
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
