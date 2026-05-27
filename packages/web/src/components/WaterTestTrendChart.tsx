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

export function WaterTestTrendChart({
  points,
  idealMin,
  idealMax,
  parameterName,
  highlightTestedAt,
}: {
  points: Point[];
  idealMin: number | null;
  idealMax: number | null;
  parameterName: string;
  highlightTestedAt?: string | null;
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        t: new Date(p.testedAt).toLocaleString('pt-BR', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        highlighted: highlightTestedAt != null && p.testedAt === highlightTestedAt,
      })),
    [points, highlightTestedAt],
  );

  const domain = useMemo((): [number, number] => {
    if (points.length === 0) return [0, 1];
    const vals = points.map((p) => p.value);
    if (idealMin != null) vals.push(idealMin);
    if (idealMax != null) vals.push(idealMax);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min;
    const pad = span > 0 ? span * 0.15 : Math.max(Math.abs(max) * 0.1, 0.5);
    return [min - pad, max + pad];
  }, [points, idealMin, idealMax]);

  if (points.length < 2) {
    return (
      <p className="text-xs text-muted-foreground">
        Registre mais testes com &quot;{parameterName}&quot; para ver a tendência ao longo do tempo.
      </p>
    );
  }

  const showBand = idealMin != null && idealMax != null && idealMax > idealMin;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tendência — {parameterName}</p>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            {showBand ? (
              <ReferenceArea y1={idealMin!} y2={idealMax!} fill="#22c55e" fillOpacity={0.12} />
            ) : null}
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 22% 22%)" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'hsl(215 16% 57%)' }} stroke="hsl(215 22% 22%)" />
            <YAxis
              domain={domain}
              tick={{ fontSize: 10, fill: 'hsl(215 16% 57%)' }}
              stroke="hsl(215 22% 22%)"
              tickFormatter={(v) => (Number.isFinite(v) ? Number(v).toPrecision(4) : '')}
            />
            <Tooltip
              formatter={(value: number) => [value, parameterName]}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { testedAt?: string } | undefined;
                return p?.testedAt ? new Date(p.testedAt).toLocaleString('pt-BR') : '';
              }}
              contentStyle={{
                fontSize: 12,
                background: 'hsl(224 44% 8%)',
                border: '1px solid hsl(215 22% 18%)',
                borderRadius: '8px',
                color: 'hsl(213 31% 91%)',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(199 89% 48%)"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props as {
                  cx: number;
                  cy: number;
                  payload?: { highlighted?: boolean };
                };
                const hi = payload?.highlighted;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hi ? 6 : 4}
                    fill={hi ? 'hsl(38 92% 50%)' : 'hsl(199 89% 48%)'}
                    stroke={hi ? 'hsl(213 31% 91%)' : 'none'}
                    strokeWidth={hi ? 2 : 0}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showBand ? (
        <p className="text-xs text-muted-foreground">
          Faixa ideal: {idealMin} – {idealMax} · ponto laranja = teste selecionado na lista
        </p>
      ) : null}
    </div>
  );
}
