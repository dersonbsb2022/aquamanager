import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WaterTest } from '../types/api.js';

const SERIES_COLORS = [
  'hsl(199 89% 48%)',
  'hsl(160 60% 45%)',
  'hsl(280 65% 60%)',
  'hsl(38 92% 50%)',
  'hsl(340 75% 55%)',
  'hsl(174 58% 42%)',
  'hsl(24 90% 55%)',
  'hsl(220 70% 58%)',
] as const;

export type Period = 'this_month' | 'last_month' | 'this_year';

function periodLabel(p: Period) {
  if (p === 'this_month') return 'Mês atual';
  if (p === 'last_month') return 'Mês anterior';
  return 'Ano';
}

function rangeForPeriod(now: Date, p: Period): { from: Date; to: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (p === 'this_year') {
    return { from: new Date(y, 0, 1, 0, 0, 0, 0), to: new Date(y, 11, 31, 23, 59, 59, 999) };
  }
  if (p === 'last_month') {
    const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const to = new Date(y, m, 0, 23, 59, 59, 999);
    return { from, to };
  }
  // this_month
  const from = new Date(y, m, 1, 0, 0, 0, 0);
  const to = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function testLabel(t: WaterTest) {
  return new Date(t.testedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function valueForParam(test: WaterTest, paramName: string): number | null {
  const r = test.results.find((x) => x.testParameter.name === paramName);
  return r ? r.value : null;
}

export function WaterTestsOverviewLineChart({
  tests,
  period,
  onPeriodChange,
  selectedTestId,
  onSelectTest,
}: {
  tests: WaterTest[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  selectedTestId: string | null;
  onSelectTest: (testId: string) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const filtered = useMemo(() => {
    const { from, to } = rangeForPeriod(now, period);
    return tests
      .filter((t) => {
        const d = new Date(t.testedAt);
        return d >= from && d <= to;
      })
      .slice(0, 8) // limita para não poluir demais
      .reverse(); // desenha do mais antigo → mais recente
  }, [tests, now, period]);

  const paramNames = useMemo(() => {
    // Mostra SOMENTE o que foi testado no período (menos poluído)
    const names = new Set<string>();
    for (const t of filtered) for (const r of t.results) names.add(r.testParameter.name);
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [filtered]);

  const data = useMemo(() => {
    return paramNames.map((name) => {
      const row: Record<string, unknown> = { param: name };
      for (const t of filtered) {
        row[t.id] = valueForParam(t, name);
      }
      return row;
    });
  }, [filtered, paramNames]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum teste no período selecionado ({periodLabel(period)}).
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Visão geral por teste</p>
          <p className="text-xs text-muted-foreground">
            Cada linha representa um teste (clique numa linha na legenda para selecionar).
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-card p-1">
          {(['this_month', 'last_month', 'this_year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {periodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 22% 22%)" />
            <XAxis
              dataKey="param"
              tick={{ fontSize: 10, fill: 'hsl(215 16% 57%)' }}
              stroke="hsl(215 22% 22%)"
              interval={0}
              height={38}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(215 16% 57%)' }}
              stroke="hsl(215 22% 22%)"
              width={44}
            />
            <Tooltip
              formatter={(value: number | null, _name, ctx) => {
                const testId = ctx?.dataKey as string;
                const idx = filtered.findIndex((t) => t.id === testId);
                const label = idx >= 0 ? testLabel(filtered[idx]) : 'Teste';
                return [value ?? '—', label];
              }}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                fontSize: 12,
                background: 'hsl(224 44% 8%)',
                border: '1px solid hsl(215 22% 18%)',
                borderRadius: '8px',
                color: 'hsl(213 31% 91%)',
              }}
            />

            {filtered.map((t, i) => {
              const selected = t.id === selectedTestId;
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <Line
                  key={t.id}
                  type="monotone" // curva
                  dataKey={t.id}
                  stroke={color}
                  strokeWidth={selected ? 3 : 2}
                  opacity={selected || selectedTestId == null ? 1 : 0.45}
                  dot={{ r: selected ? 4 : 3, fill: color, stroke: 'hsl(224 44% 8%)', strokeWidth: 1 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtered.map((t, i) => {
          const selected = t.id === selectedTestId;
          const color = SERIES_COLORS[i % SERIES_COLORS.length];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTest(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                selected
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              title="Selecionar teste"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
              {testLabel(t)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

