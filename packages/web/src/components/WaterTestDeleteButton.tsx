import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../services/api.js';
import type { AccessToken, WaterTest } from '../types/api.js';
import { DeleteIconButton } from './row-actions.js';

export function invalidateAquariumTestQueries(
  qc: ReturnType<typeof useQueryClient>,
  aquariumId: string,
) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['aquarium', aquariumId] }),
    qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'water-tests'] }),
    qc.invalidateQueries({ queryKey: ['aquarium', aquariumId, 'history'] }),
    qc.invalidateQueries({ queryKey: ['aquariums'] }),
  ]);
}

export function WaterTestDeleteButton({
  test,
  aquariumId,
  token,
}: {
  test: Pick<WaterTest, 'id' | 'testedAt'>;
  aquariumId: string;
  token: AccessToken | null;
}) {
  const qc = useQueryClient();
  const when = new Date(test.testedAt).toLocaleString('pt-BR');

  return (
    <DeleteIconButton
      title="Excluir teste"
      confirmMessage={`Excluir o teste de ${when}?\n\nEsta ação não pode ser desfeita.`}
      deleteFn={() => apiFetch<void>(`/water-tests/${test.id}`, { method: 'DELETE', token })}
      onSuccess={() => invalidateAquariumTestQueries(qc, aquariumId)}
    />
  );
}
