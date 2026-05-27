import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  aspectRatioFor,
  DEFAULT_PHOTO_ASPECT,
  PHOTO_ASPECT_OPTIONS,
  type PhotoAspectId,
} from '../lib/photoAspect.js';
import { blobToFile, cropImageToBlob, mimeForUpload } from '../lib/cropImage.js';
import { Button } from './ui/button.js';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const CROP_VIEW_HEIGHT = 256;

function suggestedZoomForMedia(
  media: { naturalWidth: number; naturalHeight: number },
  cropAspect: number,
): number {
  const mediaAspect = media.naturalWidth / media.naturalHeight;
  if (mediaAspect > cropAspect) {
    return Math.max(MIN_ZOOM, Math.min(1, (cropAspect / mediaAspect) * 0.98));
  }
  return 1;
}

type PhotoCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  /** Arquivo original — define JPEG/PNG/WebP do recorte */
  sourceFile?: File | null;
  title?: string;
  onClose: () => void;
  onConfirm: (file: File) => void;
  confirming?: boolean;
};

export function PhotoCropDialog({
  open,
  imageSrc,
  title = 'Ajustar foto',
  sourceFile = null,
  onClose,
  onConfirm,
  confirming = false,
}: PhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectId, setAspectId] = useState<PhotoAspectId>(DEFAULT_PHOTO_ASPECT);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = aspectRatioFor(aspectId);
  const mediaRef = useRef<{ naturalWidth: number; naturalHeight: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectId(DEFAULT_PHOTO_ASPECT);
    setCroppedAreaPixels(null);
    setError(null);
    mediaRef.current = null;
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const mime = sourceFile ? mimeForUpload(sourceFile) : 'image/jpeg';
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, mime);
      const file = blobToFile(blob, `aquarium-${Date.now()}`);
      onConfirm(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao recortar');
    } finally {
      setBusy(false);
    }
  }

  if (!open || !imageSrc) return null;

  const pending = busy || confirming;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fechar" onClick={onClose} disabled={pending} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="border-b border-border px-4 py-3">
          <h2 id="photo-crop-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o formato, arraste a foto e use o zoom. Diminua o zoom para enquadrar o aquário inteiro.
          </p>
        </div>

        <div className="space-y-3 px-4 pt-3">
          <div className="flex flex-wrap gap-2">
            {PHOTO_ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={pending}
                onClick={() => {
                  const nextAspect = aspectRatioFor(opt.id);
                  setAspectId(opt.id);
                  setCrop({ x: 0, y: 0 });
                  if (mediaRef.current) {
                    setZoom(suggestedZoomForMedia(mediaRef.current, nextAspect));
                  } else {
                    setZoom(1);
                  }
                }}
                className={`rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                  aspectId === opt.id
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="mt-0.5 block text-muted-foreground">{opt.hint}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full overflow-hidden rounded-lg bg-slate-900" style={{ height: CROP_VIEW_HEIGHT }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={(media) => {
                mediaRef.current = media;
                setCrop({ x: 0, y: 0 });
                setZoom(suggestedZoomForMedia(media, aspect));
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="crop-zoom">
                Zoom ({zoomPercent}%)
              </label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  disabled={pending || zoom <= MIN_ZOOM + 0.01}
                  onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Number((z - 0.1).toFixed(2))))}
                  aria-label="Diminuir zoom"
                >
                  −
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  disabled={pending || zoom >= MAX_ZOOM - 0.01}
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Number((z + 0.1).toFixed(2))))}
                  aria-label="Aumentar zoom"
                >
                  +
                </Button>
              </div>
            </div>
            <input
              id="crop-zoom"
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={pending}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {error ? <p className="px-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={pending || !croppedAreaPixels} onClick={() => void handleConfirm()}>
            {pending ? 'Salvando…' : 'Usar esta foto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
