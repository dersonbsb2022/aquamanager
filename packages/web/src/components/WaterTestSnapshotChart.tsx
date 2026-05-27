import { useMemo } from 'react';
import type { TestParameter, WaterTest, WaterTestResult } from '../types/api.js';
import {
  evaluateParameterStatus,
  idealRangeLabel,
  isSalinityDensityValue,
  salinityDensityBarPct,
  SALINITY_DENSITY,
  type ParameterRangeStatus,
} from '../lib/parameterRange.js';
import { Badge } from './ui/badge.js';

const BAR_COLORS = [
  'hsl(199 89% 48%)',
  'hsl(160 60% 45%)',
  'hsl(280 65% 60%)',
  'hsl(38 92% 50%)',
  'hsl(340 75% 55%)',
  'hsl(174 58% 42%)',
  'hsl(24 90% 55%)',
  'hsl(220 70% 58%)',
];

const STATUS_VALUE_COLOR: Record<ParameterRangeStatus, string> = {
  ok: 'hsl(160 60% 50%)',
  warning: 'hsl(38 92% 50%)',
  danger: 'hsl(0 72% 55%)',
};

type SnapshotItem = {
  id: string;
  name: string;
  unit: string;
  value: number;
  status: ParameterRangeStatus | null;
  idealMin: number | null;
  idealMax: number | null;
  barPct: number | null;
  isSalinityDensity: boolean;
  color: string;
};

function idealBarPct(value: number, idealMin: number | null, idealMax: number | null): number | null {
  if (idealMin == null || idealMax == null || idealMax <= idealMin) return null;
  const pct = ((value - idealMin) / (idealMax - idealMin)) * 100;
  return Math.max(4, Math.min(100, pct));
}

function rangeForResult(
  result: WaterTestResult,
  waterType: string | undefined,
  catalog: TestParameter[],
): { idealMin: number | null; idealMax: number | null } {
  const tp = catalog.find((p) => p.id === result.testParameter.id) ?? result.testParameter;
  const ranges = tp.ranges ?? [];
  const match = waterType ? ranges.find((r) => r.waterType === waterType) : ranges[0];
  return {
    idealMin: match?.idealMin ?? null,
    idealMax: match?.idealMax ?? null,
  };
}

function statusBadge(status: ParameterRangeStatus | null) {
  if (status === 'ok') return <Badge variant="success">OK</Badge>;
  if (status === 'warning') return <Badge variant="warning">Atenção</Badge>;
  if (status === 'danger') return <Badge variant="danger">Crítico</Badge>;
  return <Badge variant="default">Sem ref.</Badge>;
}

function salinityTrackGradient(): string {
  const d = SALINITY_DENSITY;
  const p = (v: number) => `${(((v - d.scaleMin) / (d.scaleMax - d.scaleMin)) * 100).toFixed(2)}%`;
  return `linear-gradient(to right,
    rgba(239,68,68,0.4) 0%,
    rgba(239,68,68,0.4) ${p(d.warnLowMin)},
    rgba(245,158,11,0.5) ${p(d.warnLowMin)},
    rgba(245,158,11,0.5) ${p(d.idealMin)},
    rgba(34,197,94,0.55) ${p(d.idealMin)},
    rgba(34,197,94,0.55) ${p(d.idealMax + 1)},
    rgba(245,158,11,0.5) ${p(d.idealMax + 1)},
    rgba(245,158,11,0.5) ${p(d.warnHighMax + 1)},
    rgba(239,68,68,0.4) ${p(d.warnHighMax + 1)},
    rgba(239,68,68,0.4) 100%)`;
}

function SalinityZoneBar({ value }: { value: number }) {
  const d = SALINITY_DENSITY;
  const markerLeft = salinityDensityBarPct(value);

  return (
    <div className="space-y-1">
      <div className="relative h-3 overflow-hidden rounded-full" style={{ background: salinityTrackGradient() }}>
        <div
          className="absolute top-1/2 z-10 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/40"
          style={{ left: `${markerLeft}%` }}
          title={`${value}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">{idealRangeLabel('Salinidade', d.idealMin, d.idealMax, 'densidade')}</p>
    </div>
  );
}

export function WaterTestSnapshotChart({
  test,
  parameterFilter,
  waterType,
  parameterCatalog = [],
}: {
  test: WaterTest | null;
  parameterFilter: string;
  waterType?: string;
  parameterCatalog?: TestParameter[];
}) {
  const items = useMemo((): SnapshotItem[] => {
    if (!test) return [];
    let results = [...test.results];
    if (parameterFilter) {
      results = results.filter((r) => r.testParameter.name === parameterFilter);
    }
    results.sort((a, b) => a.testParameter.name.localeCompare(b.testParameter.name, 'pt-BR'));

    return results.map((r, i) => {
      const { idealMin, idealMax } = rangeForResult(r, waterType, parameterCatalog);
      const status = evaluateParameterStatus(r.value, r.testParameter.name, { idealMin, idealMax });
      const isSalinityDensity = r.testParameter.name === 'Salinidade' && isSalinityDensityValue(r.value);
      const barPct = isSalinityDensity
        ? salinityDensityBarPct(r.value)
        : idealBarPct(r.value, idealMin, idealMax);

      return {
        id: r.id,
        name: r.testParameter.name,
        unit: isSalinityDensity ? 'densidade (SG×1000)' : r.testParameter.unit,
        value: r.value,
        status,
        idealMin,
        idealMax,
        barPct,
        isSalinityDensity,
        color: status ? STATUS_VALUE_COLOR[status] : BAR_COLORS[i % BAR_COLORS.length],
      };
    });
  }, [test, parameterFilter, waterType, parameterCatalog]);

  if (!test) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum teste selecionado.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        {parameterFilter
          ? `O teste de ${new Date(test.testedAt).toLocaleString('pt-BR')} não inclui "${parameterFilter}".`
          : 'Este teste não possui resultados registrados.'}
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">
        Teste de{' '}
        <span className="font-medium text-foreground">{new Date(test.testedAt).toLocaleString('pt-BR')}</span>
        {parameterFilter ? (
          <>
            {' '}
            · parâmetro <span className="font-medium text-primary">{parameterFilter}</span>
          </>
        ) : (
          <> · {items.length} parâmetro(s)</>
        )}
      </p>

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {item.name}
                <span className="ml-1 font-normal text-muted-foreground">({item.unit})</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums" style={{ color: item.color }}>
                  {item.value}
                </span>
                {statusBadge(item.status)}
              </div>
            </div>

            {item.isSalinityDensity ? (
              <SalinityZoneBar value={item.value} />
            ) : item.barPct != null ? (
              <div className="space-y-1">
                <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/25"
                    style={{ width: '100%' }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${item.barPct}%`,
                      backgroundColor: item.status ? STATUS_VALUE_COLOR[item.status] : item.color,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {idealRangeLabel(item.name, item.idealMin, item.idealMax, item.unit)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {idealRangeLabel(item.name, item.idealMin, item.idealMax, item.unit)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
