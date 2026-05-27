import jwt, { type SignOptions } from 'jsonwebtoken';
import { loadEnv } from '../../config/env.js';
import { AppError, unauthorized } from '../errors/app-error.js';

export type TokenKind = 'access' | 'refresh';

export type JwtPayload = { sub: string; typ: TokenKind };

export function signAccessToken(userId: string): string {
  const env = loadEnv();
  return jwt.sign({ sub: userId, typ: 'access' satisfies TokenKind }, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(userId: string): string {
  const env = loadEnv();
  return jwt.sign({ sub: userId, typ: 'refresh' satisfies TokenKind }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const env = loadEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (decoded.typ !== 'access') throw unauthorized('Token inválido');
    return decoded;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw unauthorized('Token expirado ou inválido');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  const env = loadEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    if (decoded.typ !== 'refresh') throw unauthorized('Refresh token inválido');
    return decoded;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw unauthorized('Refresh token expirado ou inválido');
  }
}
