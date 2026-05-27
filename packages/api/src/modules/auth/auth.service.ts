import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import { conflict, unauthorized } from '../../shared/errors/app-error.js';
import { signAccessToken, signRefreshToken } from '../../shared/utils/jwt.js';
import type { LoginBody, RegisterBody } from './auth.schema.js';

const SALT_ROUNDS = 10;

export type AuthTokens = { accessToken: string; refreshToken: string };

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function registerUser(
  prisma: PrismaClient,
  body: RegisterBody,
): Promise<{ user: SafeUser } & AuthTokens> {
  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    throw conflict('E-mail já cadastrado');
  }
  const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
    },
  });
  return {
    user: toSafeUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function loginUser(
  prisma: PrismaClient,
  body: LoginBody,
): Promise<{ user: SafeUser } & AuthTokens> {
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user) {
    throw unauthorized('Credenciais inválidas');
  }
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    throw unauthorized('Credenciais inválidas');
  }
  return {
    user: toSafeUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}

export function refreshSession(userId: string): AuthTokens {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  };
}

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
