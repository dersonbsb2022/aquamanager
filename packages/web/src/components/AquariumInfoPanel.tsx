import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { apiFetch } from '../services/api.js';
import type { AccessToken, AquariumNote, Paginated } from '../types/api.js';
import { Button } from './ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

type AquariumInfo = {
  id: string;
  photoUrl: string | null;
  targetTempMin: number | null;
  targetTempMax: number | null;
  isActive: boolean;
};

export function AquariumInfoPanel({
  aquarium,
  token,
}: {
  aquarium: AquariumInfo;
  token: AccessToken | null;
}) {
  const qc = useQueryClient();
  const [tempMin, setTempMin] = useState('');
  const [tempMax, setTempMax] = useState('');
  const [editingTemp, setEditingTemp] = useState(true);
  const [noteDraft, setNoteDraft] = useState('');
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditText, setNoteEditText] = useState('');

  useEffect(() => {
    setTempMin(aquarium.targetTempMin != null ? String(aquarium.targetTempMin) : '');
    setTempMax(aquarium.targetTempMax != null ? String(aquarium.targetTempMax) : '');
  }, [aquarium.targetTempMin, aquarium.targetTempMax]);

  useEffect(() => {
    setEditingTemp(true);
    setEditingNoteId(null);
  }, [aquarium.id]);

  const notesQ = useQuery({
    queryKey: ['aquarium', aquarium.id, 'notes', showAllNotes ? 'all' : 'recent'],
    queryFn: () =>
      apiFetch<Paginated<AquariumNote>>(
        `/aquariums/${aquarium.id}/notes?page=1&perPage=${showAllNotes ? 50 : 3}`,
        { token },
      ),
    enabled: Boolean(token),
  });

  const saveTempM = useMutation({
    mutationFn: () => {
      const minV = tempMin.trim() === '' ? null : Number(tempMin);
      const maxV = tempMax.trim() === '' ? null : Number(tempMax);
      if (minV !== null && Number.isNaN(minV)) throw new Error('Temperatura mínima inválida');
      if (maxV !== null && Number.isNaN(maxV)) throw new Error('Temperatura máxima inválida');
      return apiFetch<{ targetTempMin: number | null; targetTempMax: number | null }>(
        `/aquariums/${aquarium.id}`,
        {
          method: 'PUT',
          token,
          body: JSON.stringify({
            targetTempMin: minV,
            targetTempMax: maxV,
          }),
        },
      );
    },
    onSuccess: async () => {
      setEditingTemp(false);
      await qc.invalidateQueries({ queryKey: ['aquarium', aquarium.id] });
    },
  });

  const addNoteM = useMutation({
    mutationFn: (content: string) =>
      apiFetch<AquariumNote>(`/aquariums/${aquarium.id}/notes`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content }),
      }),
    onSuccess: async () => {
      setNoteDraft('');
      await qc.invalidateQueries({ queryKey: ['aquarium', aquarium.id, 'notes'] });
    },
  });

  const updateNoteM = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiFetch<AquariumNote>(`/aquarium-notes/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ content }),
      }),
    onSuccess: async () => {
      setEditingNoteId(null);
      await qc.invalidateQueries({ queryKey: ['aquarium', aquarium.id, 'notes'] });
    },
  });

  const deleteNoteM = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/aquarium-notes/${id}`, {
        method: 'DELETE',
        token,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['aquarium', aquarium.id, 'notes'] });
    },
  });

  function onSaveTemp(e: FormEvent) {
    e.preventDefault();
    saveTempM.mutate();
  }

  function onAddNote(e: FormEvent) {
    e.preventDefault();
    const text = noteDraft.trim();
    if (!text) return;
    addNoteM.mutate(text);
  }

  function startEditNote(note: AquariumNote) {
    setEditingNoteId(note.id);
    setNoteEditText(note.content);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
  }

  function saveEditNote(noteId: string) {
    const content = noteEditText.trim();
    if (!content) return;
    updateNoteM.mutate({ id: noteId, content });
  }

  function requestDeleteNote(note: AquariumNote) {
    const ok =
      typeof window !== 'undefined' &&
      window.confirm('Excluir esta nota permanentemente?\n\n' + note.content.slice(0, 80) + (note.content.length > 80 ? '…' : ''));
    if (ok) deleteNoteM.mutate(note.id);
  }

  const notes = notesQ.data?.items ?? [];
  const totalNotes = notesQ.data?.meta.total ?? 0;
  const hiddenCount = Math.max(0, totalNotes - 3);

  const tempFieldsDisabled = !aquarium.isActive || !editingTemp;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-slate-700">
        {aquarium.photoUrl ? (
          <img alt="" src={aquarium.photoUrl} className="max-h-48 rounded-lg border" />
        ) : null}

        <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="font-medium text-slate-900">Temperatura alvo (°C)</p>
          <form className="space-y-3" onSubmit={onSaveTemp}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tempMin">Mínima</Label>
                <Input
                  id="tempMin"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 24"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  disabled={tempFieldsDisabled}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tempMax">Máxima</Label>
                <Input
                  id="tempMax"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 28"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  disabled={tempFieldsDisabled}
                />
              </div>
            </div>
            {saveTempM.isError ? (
              <p className="text-xs text-red-600">{(saveTempM.error as Error).message}</p>
            ) : null}
            {editingTemp ? (
              <Button type="submit" size="sm" disabled={!aquarium.isActive || saveTempM.isPending}>
                {saveTempM.isPending ? 'Salvando…' : 'Salvar temperatura'}
              </Button>
            ) : (
              <>
                <p className="text-xs font-medium text-emerald-700">Temperatura alvo salva.</p>
                <Button type="button" variant="outline" size="sm" disabled={!aquarium.isActive} onClick={() => setEditingTemp(true)}>
                  Editar temperatura
                </Button>
              </>
            )}
          </form>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-slate-900">Notas</p>
            {totalNotes > 0 ? (
              <span className="text-xs text-slate-500">{totalNotes} no histórico</span>
            ) : null}
          </div>

          {notesQ.isLoading ? <p className="text-slate-500">Carregando notas…</p> : null}

          {notes.length === 0 && !notesQ.isLoading ? (
            <p className="text-slate-500">Nenhuma nota registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-slate-200 bg-white p-3">
                  {editingNoteId === n.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        value={noteEditText}
                        onChange={(e) => setNoteEditText(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" disabled={updateNoteM.isPending} onClick={() => saveEditNote(n.id)}>
                          {updateNoteM.isPending ? 'Salvando…' : 'Salvar'}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelEditNote}>
                          Cancelar
                        </Button>
                      </div>
                      {updateNoteM.isError ? (
                        <p className="text-xs text-red-600">{(updateNoteM.error as Error).message}</p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-slate-800">{n.content}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            title="Editar"
                            onClick={() => startEditNote(n)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                            title="Excluir"
                            disabled={deleteNoteM.isPending}
                            onClick={() => requestDeleteNote(n)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!showAllNotes && hiddenCount > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAllNotes(true)}>
              Ver histórico completo (+{hiddenCount})
            </Button>
          ) : null}
          {showAllNotes && totalNotes > 3 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAllNotes(false)}>
              Mostrar só as 3 mais recentes
            </Button>
          ) : null}

          <form className="space-y-2 border-t border-slate-100 pt-4" onSubmit={onAddNote}>
            <Label htmlFor="newNote">Nova nota</Label>
            <textarea
              id="newNote"
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
              placeholder="Ex: faltou luz durante as 21h…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              disabled={!aquarium.isActive}
            />
            {addNoteM.isError ? (
              <p className="text-xs text-red-600">{(addNoteM.error as Error).message}</p>
            ) : null}
            <Button type="submit" size="sm" disabled={!aquarium.isActive || addNoteM.isPending}>
              Adicionar nota
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
