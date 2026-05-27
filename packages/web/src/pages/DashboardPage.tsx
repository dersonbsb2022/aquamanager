import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type { AquariumListItem, Paginated } from '../types/api.js';
import { AquariumPhoto } from '../components/AquariumPhoto.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';

function waterLabel(w: string) {
  if (w === 'FRESHWATER') return 'Doce';
  if (w === 'SALTWATER') return 'Salgada';
  if (w === 'BRACKISH') return 'Salobra';
  return w;
}

function summaryBadge(s: 'ok' | 'warning' | 'unknown') {
  if (s === 'ok') return { label: 'Parâmetros OK', variant: 'success' as const };
  if (s === 'warning') return { label: 'Atenção', variant: 'warning' as const };
  return { label: 'Sem referência', variant: 'default' as const };
}

export function DashboardPage() {
  const { token } = useAuth();
  const q = useQuery({
    queryKey: ['aquariums', { page: 1 }],
    queryFn: () =>
      apiFetch<Paginated<AquariumListItem>>(`/aquariums?page=${1}&perPage=${20}`, { token }),
    enabled: Boolean(token),
  });

  const items = useMemo(() => q.data?.items ?? [], [q.data?.items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Seus aquários</h2>
          <p className="text-sm text-muted-foreground">Cards com fauna viva e resumo do último teste de água</p>
        </div>
        <Link to="/aquariums/new">
          <Button>Novo aquário</Button>
        </Link>
      </div>

      {q.isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
      {q.isError ? <p className="text-sm text-red-600">Falha ao carregar lista</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((a) => {
          const s = a.lastWaterTest?.summary ?? 'unknown';
          const b = summaryBadge(s);
          return (
            <Link key={a.id} to={`/aquariums/${a.id}`} className="block">
              <Card className="h-full hover:border-primary/40 hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <AquariumPhoto src={a.photoUrl} name={a.name} variant="card" />
                      <span className="truncate">{a.name}</span>
                    </span>
                    {!a.isActive ? <Badge variant="warning">Inativo</Badge> : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {a.volumeLiters} L · {waterLabel(a.waterType)}
                  </p>
                  <p>Fauna viva: {a.aliveQuantity} indivíduos (soma quantidades)</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Último teste</span>
                    {a.lastWaterTest ? <Badge variant={b.variant}>{b.label}</Badge> : <Badge>Nenhum</Badge>}
                  </div>
                  {a.lastWaterTest ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.lastWaterTest.testedAt).toLocaleString('pt-BR')}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
