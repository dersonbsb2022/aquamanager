import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import {
  diskPathFromPhotoUrl,
  extensionForMime,
  getUploadDir,
  isAllowedImageMime,
  publicPathForFilename,
} from '../../config/uploads.js';
import { badRequest } from '../errors/app-error.js';

type ImagePayload = {
  buffer: Buffer;
  mimetype: string;
};

export async function saveImageFile(payload: ImagePayload): Promise<string> {
  if (!isAllowedImageMime(payload.mimetype)) {
    throw badRequest('Formato não suportado. Use JPEG, PNG, WebP ou GIF.');
  }
  if (payload.buffer.length === 0) {
    throw badRequest('Arquivo vazio.');
  }

  const ext = extensionForMime(payload.mimetype);
  if (!ext) throw badRequest('Formato não suportado.');

  const filename = `${randomUUID()}${ext}`;
  const abs = `${getUploadDir()}/${filename}`;
  await writeFile(abs, payload.buffer);
  return publicPathForFilename(filename);
}

export async function deletePhotoFile(photoUrl: string | null | undefined): Promise<void> {
  const abs = diskPathFromPhotoUrl(photoUrl);
  if (!abs) return;
  try {
    await unlink(abs);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') throw e;
  }
}
