import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { deletePhotoFile, saveImageFile } from '../../shared/uploads/storage.js';

type ImagePayload = {
  buffer: Buffer;
  mimetype: string;
};

export async function uploadAquariumPhoto(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  file: ImagePayload,
) {
  const aquarium = await prisma.aquarium.findFirst({ where: { id: aquariumId, userId } });
  if (!aquarium) throw notFound('Aquário não encontrado');

  const photoUrl = await saveImageFile(file);
  if (aquarium.photoUrl) await deletePhotoFile(aquarium.photoUrl);

  return prisma.aquarium.update({
    where: { id: aquariumId },
    data: { photoUrl },
  });
}

export async function deleteAquariumPhoto(prisma: PrismaClient, userId: string, aquariumId: string) {
  const aquarium = await prisma.aquarium.findFirst({ where: { id: aquariumId, userId } });
  if (!aquarium) throw notFound('Aquário não encontrado');

  if (aquarium.photoUrl) await deletePhotoFile(aquarium.photoUrl);

  return prisma.aquarium.update({
    where: { id: aquariumId },
    data: { photoUrl: null },
  });
}

export async function uploadAnimalPhoto(
  prisma: PrismaClient,
  userId: string,
  animalId: string,
  file: ImagePayload,
) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, aquarium: { userId } },
  });
  if (!animal) throw notFound('Animal não encontrado');

  const photoUrl = await saveImageFile(file);
  if (animal.photoUrl) await deletePhotoFile(animal.photoUrl);

  return prisma.animal.update({
    where: { id: animalId },
    data: { photoUrl },
  });
}

export async function deleteAnimalPhoto(prisma: PrismaClient, userId: string, animalId: string) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, aquarium: { userId } },
  });
  if (!animal) throw notFound('Animal não encontrado');

  if (animal.photoUrl) await deletePhotoFile(animal.photoUrl);

  return prisma.animal.update({
    where: { id: animalId },
    data: { photoUrl: null },
  });
}
