import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch, apiUpload } from '../services/api.js';
import type { WaterType } from '../types/api.js';
import { AquariumPhoto } from '../components/AquariumPhoto.js';
import { PhotoCropDialog } from '../components/PhotoCropDialog.js';
import { RowActions, RowIconButton, rowIconClass } from '../components/row-actions.js';
import { ImagePlus } from 'lucide-react';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

type Created = { id: string };

export function NewAquariumPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const m = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const row = await apiFetch<Created>('/aquariums', { method: 'POST', body: JSON.stringify(body), token });
      if (photoFile) {
        await apiUpload(`/aquariums/${row.id}/photo`, photoFile, { token });
      }
      return row;
    },
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: ['aquariums'] });
      nav(`/aquariums/${row.id}`);
    },
  });

  function closeCropDialog() {
    if (cropImageSrc?.startsWith('blob:')) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropSourceFile(null);
    setCropOpen(false);
  }

  function onPhotoPicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (cropImageSrc?.startsWith('blob:')) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(URL.createObjectURL(file));
    setCropSourceFile(file);
    setCropOpen(true);
  }

  function onCropConfirm(file: File) {
    setPhotoFile(file);
    closeCropDialog();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '');
    const volumeLiters = Number(fd.get('volumeLiters'));
    const waterType = String(fd.get('waterType') ?? 'FRESHWATER') as WaterType;
    m.mutate({ name, volumeLiters, waterType });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Novo aquário</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volumeLiters">Volume (litros)</Label>
            <Input id="volumeLiters" name="volumeLiters" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterType">Tipo de água</Label>
            <select
              id="waterType"
              name="waterType"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
              defaultValue="FRESHWATER"
            >
              <option value="FRESHWATER">Doce</option>
              <option value="SALTWATER">Salgada</option>
              <option value="BRACKISH">Salobra</option>
            </select>
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <Label htmlFor="photo">Foto (opcional)</Label>
            {photoPreviewUrl ? (
              <div className="flex justify-center">
                <AquariumPhoto src={photoPreviewUrl} name="Novo" variant="hero" />
              </div>
            ) : null}
            <RowActions>
              <label
                title={photoFile ? 'Trocar foto' : 'Escolher foto'}
                className={rowIconClass('edit')}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={onPhotoPicked}
                />
                <span className="sr-only">{photoFile ? 'Trocar foto' : 'Escolher foto'}</span>
              </label>
              {photoFile ? (
                <RowIconButton
                  variant="delete"
                  title="Remover foto"
                  onClick={() => {
                    setPhotoFile(null);
                    if (photoPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(photoPreviewUrl);
                    setPhotoPreviewUrl(null);
                  }}
                />
              ) : null}
            </RowActions>
            <p className="text-xs text-muted-foreground">
              Ao escolher, ajuste o formato (panorâmico para aquários longos, quadrado para cubo).
            </p>
          </div>
          {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
          <Button type="submit" disabled={m.isPending}>
            {m.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </CardContent>

      <PhotoCropDialog
        open={cropOpen}
        imageSrc={cropImageSrc}
        sourceFile={cropSourceFile}
        title="Foto do aquário"
        onClose={closeCropDialog}
        onConfirm={onCropConfirm}
      />
    </Card>
  );
}
