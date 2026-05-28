import { Prisma } from '@prisma/client';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  createAquarium,
  getAquariumDetail,
  getAquariumSummary,
  listAquariums,
  softDeleteAquarium,
  updateAquarium,
} from './modules/aquarium/aquarium.service.js';
import {
  createAquariumBodySchema,
  listAquariumsQuerySchema,
  updateAquariumBodySchema,
} from './modules/aquarium/aquarium.schema.js';
import {
  createAnimal,
  deleteAnimal,
  listAnimals,
  patchAnimalStatus,
  updateAnimal,
} from './modules/animal/animal.service.js';
import {
  createAnimalBodySchema,
  patchAnimalStatusSchema,
  updateAnimalBodySchema,
} from './modules/animal/animal.schema.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import {
  createTestParameterBodySchema,
  updateTestParameterBodySchema,
} from './modules/test-parameter/test-parameter.schema.js';
import {
  createTestParameter,
  deleteTestParameter,
  listTestParameters,
  updateTestParameter,
} from './modules/test-parameter/test-parameter.service.js';
import {
  createWaterTestBodySchema,
  listWaterTestsQuerySchema,
  waterTestHistoryQuerySchema,
} from './modules/water-test/water-test.schema.js';
import {
  createWaterTest,
  deleteWaterTest,
  getWaterTestById,
  historyForParameter,
  listWaterTests,
} from './modules/water-test/water-test.service.js';
import { createWaterChangeBodySchema } from './modules/water-change/water-change.schema.js';
import { createWaterChange, deleteWaterChange, listWaterChanges } from './modules/water-change/water-change.service.js';
import {
  createEquipmentBodySchema,
  equipmentMaintenanceBodySchema,
  updateEquipmentBodySchema,
} from './modules/equipment/equipment.schema.js';
import {
  createEquipment,
  deleteEquipment,
  listEquipments,
  recordEquipmentMaintenance,
  updateEquipment,
} from './modules/equipment/equipment.service.js';
import { createDosingBodySchema } from './modules/dosing/dosing.schema.js';
import { createDosing, deleteDosing, listDosings } from './modules/dosing/dosing.service.js';
import {
  createAquariumNoteBodySchema,
  updateAquariumNoteBodySchema,
} from './modules/aquarium-note/aquarium-note.schema.js';
import {
  createAquariumNote,
  deleteAquariumNote,
  listAquariumNotes,
  updateAquariumNote,
} from './modules/aquarium-note/aquarium-note.service.js';
import { updateProfileBodySchema } from './modules/user/user.schema.js';
import { getProfile, updateProfile } from './modules/user/user.service.js';
import {
  deleteAnimalPhoto,
  deleteAquariumPhoto,
  uploadAnimalPhoto,
  uploadAquariumPhoto,
} from './modules/photo/photo.service.js';
import { badRequest, notFound } from './shared/errors/app-error.js';
import { sendNoContent, sendOk } from './shared/http/reply.js';
import { authMiddleware } from './shared/middlewares/auth.js';
import { paginationQuerySchema } from './shared/utils/pagination.js';

const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

const aquariumParamSchema = z.object({
  aquariumId: z.string().uuid(),
});

async function readPhotoUpload(req: FastifyRequest) {
  const file = await req.file();
  if (!file) throw badRequest('Envie uma imagem no campo "photo"');
  return { buffer: await file.toBuffer(), mimetype: file.mimetype };
}

async function authedRoutesPlugin(instance: FastifyInstance): Promise<void> {
  instance.addHook('preHandler', authMiddleware);

  instance.get('/users/me', async (req, reply) => {
      const userId = req.userId!;
      const profile = await getProfile(instance.prisma, userId);
      return sendOk(reply, profile);
    });

    instance.patch('/users/me', async (req, reply) => {
      const body = updateProfileBodySchema.parse(req.body);
      if (body.name === undefined) {
        return reply.status(422).send({
          error: { message: 'Informe pelo menos um campo', code: 'VALIDATION_ERROR' },
        });
      }
      const userId = req.userId!;
      const profile = await updateProfile(instance.prisma, userId, body);
      return sendOk(reply, profile);
    });

    instance.get('/test-parameters', async (req, reply) => {
      const query = paginationQuerySchema.parse(req.query);
      const result = await listTestParameters(instance.prisma, query);
      return sendOk(reply, result);
    });

    instance.post('/test-parameters', async (req, reply) => {
      const body = createTestParameterBodySchema.parse(req.body);
      try {
        const created = await createTestParameter(instance.prisma, body);
        return sendOk(reply, created, 201);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          return reply.status(409).send({
            error: { message: 'Nome de parâmetro já existe', code: 'CONFLICT' },
          });
        }
        throw e;
      }
    });

    instance.put('/test-parameters/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const body = updateTestParameterBodySchema.parse(req.body);
      if (Object.keys(body).length === 0) {
        return reply.status(422).send({
          error: { message: 'Nada para atualizar', code: 'VALIDATION_ERROR' },
        });
      }
      const existing = await instance.prisma.testParameter.findUnique({ where: { id } });
      if (!existing) throw notFound('Parâmetro não encontrado');
      try {
        const updated = await updateTestParameter(instance.prisma, id, body);
        return sendOk(reply, updated);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          return reply.status(409).send({
            error: { message: 'Nome de parâmetro já existe', code: 'CONFLICT' },
          });
        }
        throw e;
      }
    });

    instance.delete('/test-parameters/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      await deleteTestParameter(instance.prisma, id);
      return sendNoContent(reply);
    });

    instance.get('/water-tests/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      const test = await getWaterTestById(instance.prisma, userId, id);
      return sendOk(reply, test);
    });

    instance.delete('/water-tests/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      await deleteWaterTest(instance.prisma, userId, id);
      return sendNoContent(reply);
    });

    instance.put('/animals/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const body = updateAnimalBodySchema.parse(req.body);
      if (Object.keys(body).length === 0) {
        return reply.status(422).send({
          error: { message: 'Nada para atualizar', code: 'VALIDATION_ERROR' },
        });
      }
      const userId = req.userId!;
      const animal = await updateAnimal(instance.prisma, userId, id, body);
      return sendOk(reply, animal);
    });

    instance.patch('/animals/:id/status', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const body = patchAnimalStatusSchema.parse(req.body);
      const userId = req.userId!;
      const animal = await patchAnimalStatus(instance.prisma, userId, id, body);
      return sendOk(reply, animal);
    });

    instance.post('/animals/:id/photo', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      const file = await readPhotoUpload(req);
      const animal = await uploadAnimalPhoto(instance.prisma, userId, id, file);
      return sendOk(reply, animal);
    });

    instance.delete('/animals/:id/photo', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      const animal = await deleteAnimalPhoto(instance.prisma, userId, id);
      return sendOk(reply, animal);
    });

    instance.delete('/animals/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      await deleteAnimal(instance.prisma, userId, id);
      return sendNoContent(reply);
    });

    instance.put('/equipments/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const body = updateEquipmentBodySchema.parse(req.body);
      if (Object.keys(body).length === 0) {
        return reply.status(422).send({
          error: { message: 'Nada para atualizar', code: 'VALIDATION_ERROR' },
        });
      }
      const userId = req.userId!;
      const eq = await updateEquipment(instance.prisma, userId, id, body);
      return sendOk(reply, eq);
    });

    instance.patch('/equipments/:id/maintenance', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const body = equipmentMaintenanceBodySchema.parse(req.body);
      const userId = req.userId!;
      const eq = await recordEquipmentMaintenance(instance.prisma, userId, id, body);
      return sendOk(reply, eq);
    });

    instance.delete('/equipments/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      await deleteEquipment(instance.prisma, userId, id);
      return sendNoContent(reply);
    });

    instance.delete('/water-changes/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      await deleteWaterChange(instance.prisma, userId, id);
      return sendNoContent(reply);
    });

    instance.delete('/dosings/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      await deleteDosing(instance.prisma, userId, id);
      return sendNoContent(reply);
    });

    instance.get('/aquariums', async (req, reply) => {
      const query = listAquariumsQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listAquariums(instance.prisma, userId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums', async (req, reply) => {
      const body = createAquariumBodySchema.parse(req.body);
      const userId = req.userId!;
      const aquarium = await createAquarium(instance.prisma, userId, body);
      return sendOk(reply, aquarium, 201);
    });

    instance.get('/aquariums/:aquariumId/summary', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const userId = req.userId!;
      const summary = await getAquariumSummary(instance.prisma, userId, aquariumId);
      return sendOk(reply, summary);
    });

    instance.get('/aquariums/:aquariumId/water-tests/history', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = waterTestHistoryQuerySchema.parse(req.query);
      const userId = req.userId!;
      const history = await historyForParameter(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, history);
    });

    instance.get('/aquariums/:aquariumId/water-tests', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = listWaterTestsQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listWaterTests(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums/:aquariumId/water-tests', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = createWaterTestBodySchema.parse(req.body);
      const userId = req.userId!;
      const test = await createWaterTest(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, test, 201);
    });

    instance.get('/aquariums/:aquariumId/animals', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = paginationQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listAnimals(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums/:aquariumId/animals', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = createAnimalBodySchema.parse(req.body);
      const userId = req.userId!;
      const animal = await createAnimal(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, animal, 201);
    });

    instance.get('/aquariums/:aquariumId/water-changes', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = paginationQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listWaterChanges(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums/:aquariumId/water-changes', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = createWaterChangeBodySchema.parse(req.body);
      const userId = req.userId!;
      const wc = await createWaterChange(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, wc, 201);
    });

    instance.get('/aquariums/:aquariumId/equipments', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = paginationQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listEquipments(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums/:aquariumId/equipments', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = createEquipmentBodySchema.parse(req.body);
      const userId = req.userId!;
      const eq = await createEquipment(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, eq, 201);
    });

    instance.get('/aquariums/:aquariumId/dosings', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = paginationQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listDosings(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums/:aquariumId/dosings', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = createDosingBodySchema.parse(req.body);
      const userId = req.userId!;
      const d = await createDosing(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, d, 201);
    });

    instance.get('/aquariums/:aquariumId/notes', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const query = paginationQuerySchema.parse(req.query);
      const userId = req.userId!;
      const result = await listAquariumNotes(instance.prisma, userId, aquariumId, query);
      return sendOk(reply, result);
    });

    instance.post('/aquariums/:aquariumId/notes', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = createAquariumNoteBodySchema.parse(req.body);
      const userId = req.userId!;
      const note = await createAquariumNote(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, note, 201);
    });

    instance.patch('/aquarium-notes/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const body = updateAquariumNoteBodySchema.parse(req.body);
      const userId = req.userId!;
      const note = await updateAquariumNote(instance.prisma, userId, id, body);
      return sendOk(reply, note);
    });

    instance.delete('/aquarium-notes/:id', async (req, reply) => {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.userId!;
      await deleteAquariumNote(instance.prisma, userId, id);
      return sendNoContent(reply);
    });

    instance.get('/aquariums/:aquariumId', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const userId = req.userId!;
      const detail = await getAquariumDetail(instance.prisma, userId, aquariumId);
      return sendOk(reply, detail);
    });

    instance.put('/aquariums/:aquariumId', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const body = updateAquariumBodySchema.parse(req.body);
      const userId = req.userId!;
      const aquarium = await updateAquarium(instance.prisma, userId, aquariumId, body);
      return sendOk(reply, aquarium);
    });

    instance.post('/aquariums/:aquariumId/photo', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const userId = req.userId!;
      const file = await readPhotoUpload(req);
      const aquarium = await uploadAquariumPhoto(instance.prisma, userId, aquariumId, file);
      return sendOk(reply, aquarium);
    });

    instance.delete('/aquariums/:aquariumId/photo', async (req, reply) => {
      const { aquariumId } = aquariumParamSchema.parse(req.params);
      const userId = req.userId!;
      const aquarium = await deleteAquariumPhoto(instance.prisma, userId, aquariumId);
      return sendOk(reply, aquarium);
    });

  instance.delete('/aquariums/:aquariumId', async (req, reply) => {
    const { aquariumId } = aquariumParamSchema.parse(req.params);
    const userId = req.userId!;
    await softDeleteAquarium(instance.prisma, userId, aquariumId);
    return sendNoContent(reply);
  });
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(authedRoutesPlugin);
}
