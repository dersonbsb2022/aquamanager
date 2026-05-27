import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = { testedAt: string; value: number; isWithinRange: boolean | null };

export function WaterParameterChart({
  points,
  idealMin,
  idealMax,
}: {
  points: Point[];
  idealMin: number | null;
  idealMax: number | null;
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        t: new Date(p.testedAt).toLocaleString('pt-BR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      })),
    [points],
  );

  const [ymin, ymax] = useMemo(() => {
    const vals = points.map((p) => p.value);
    if (idealMin != null) vals.push(idealMin);
    if (idealMax != null) vals.push(idealMax);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.1 || 1;
    return [min - pad, max + pad];
  }, [points, idealMin, idealMax]);

  const showBand = idealMin != null && idealMax != null;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          {showBand ? (
            <ReferenceArea y1={idealMin!} y2={idealMax!} fill="#22c55e" fillOpacity={0.08} />
          ) : null}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fontSize: 11 }} />
          <YAxis domain={[ymin, ymax]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [value, 'Valor']}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { testedAt?: string } | undefined;
              return p?.testedAt ? new Date(p.testedAt).toLocaleString('pt-BR') : '';
            }}
            contentStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
        {idealMin != null || idealMax != null ? (
          <span>
            Faixa ideal: {idealMin ?? '—'} a {idealMax ?? '—'}
          </span>
        ) : (
          <span>Sem faixa cadastrada para este tipo de água</span>
        )}
      </div>
    </div>
  );
}
