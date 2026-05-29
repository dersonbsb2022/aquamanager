import type { ParameterRangeInput } from '../lib/waterTypes.js';
import { WATER_TYPES } from '../lib/waterTypes.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

type Props = {
  ranges: ParameterRangeInput[];
  onChange: (ranges: ParameterRangeInput[]) => void;
  compact?: boolean;
};

export function ParameterRangesFields({ ranges, onChange, compact }: Props) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3 rounded-lg border border-border bg-muted/30 p-3'}>
      {!compact ? (
        <p className="text-xs text-muted-foreground">
          Faixa ideal por tipo de água (usada nos alertas). Preencha pelo menos um tipo. Salinidade
          marinho: use densidade 1024–1026.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {WATER_TYPES.map((wt) => {
          const row = ranges.find((r) => r.waterType === wt.value)!;
          const idx = ranges.findIndex((r) => r.waterType === wt.value);
          return (
            <div key={wt.value} className="space-y-2 rounded-md border border-border/60 p-2">
              <Label className="text-xs font-medium">{wt.label}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Mín.</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={row.idealMin}
                    onChange={(e) => {
                      const next = [...ranges];
                      next[idx] = { ...next[idx], idealMin: e.target.value };
                      onChange(next);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Máx.</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.25"
                    value={row.idealMax}
                    onChange={(e) => {
                      const next = [...ranges];
                      next[idx] = { ...next[idx], idealMax: e.target.value };
                      onChange(next);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
