import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './env.js';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const ALLOWED_IMAGE_MIMES = Object.keys(MIME_EXT);

let uploadDirCached: string | null = null;

export function getUploadDir(): string {
  if (uploadDirCached) return uploadDirCached;
  const env = loadEnv();
  const here = dirname(fileURLToPath(import.meta.url));
  const apiRoot = resolve(here, '../..');
  uploadDirCached = env.UPLOAD_DIR ? resolve(env.UPLOAD_DIR) : resolve(apiRoot, 'uploads');
  mkdirSync(uploadDirCached, { recursive: true });
  return uploadDirCached;
}

export function getMaxUploadBytes(): number {
  const env = loadEnv();
  return env.MAX_UPLOAD_MB * 1024 * 1024;
}

export function extensionForMime(mimetype: string): string | null {
  return MIME_EXT[mimetype] ?? null;
}

export function isAllowedImageMime(mimetype: string): boolean {
  return mimetype in MIME_EXT;
}

/** Caminho público salvo no banco, ex.: /uploads/uuid.jpg */
export function publicPathForFilename(filename: string): string {
  return `/uploads/${filename}`;
}

/** Resolve caminho absoluto no disco a partir do valor do banco; null se inválido */
export function diskPathFromPhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl?.startsWith('/uploads/')) return null;
  const filename = photoUrl.slice('/uploads/'.length);
  if (!filename || filename.includes('/') || filename.includes('..')) return null;
  return resolve(getUploadDir(), filename);
}
