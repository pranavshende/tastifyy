import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { getJwtSecret } from '../utils/jwt.js';

const REFRESH_COOKIE = 'tastifyy_refresh';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshCookieOptions() {
  const configuredSameSite = process.env.AUTH_COOKIE_SAME_SITE?.toLowerCase();
  const sameSite = configuredSameSite === 'strict' || configuredSameSite === 'lax' || configuredSameSite === 'none'
    ? configuredSameSite
    : process.env.NODE_ENV === 'production' ? 'none' : 'lax';

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_MS,
  } as const;
}

function readRefreshCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  return cookie ? cookie.slice(REFRESH_COOKIE.length + 1) || null : null;
}

export function isTrustedCookieRequest(req: Request): boolean {
  const origin = req.get('origin');
  if (!origin) return process.env.NODE_ENV !== 'production';

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim())
    : [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://www.tastifyy.in',
        'https://tastifyy.in',
      ];
  return allowedOrigins.includes(origin);
}

function createAccessToken(user: Pick<User, 'id' | 'email' | 'phone'>): string {
  return jwt.sign(
    {
      sub: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      phone: user.phone,
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  );
}

function createSessionResponse(user: Pick<User, 'id' | 'email' | 'phone'>) {
  return {
    access_token: createAccessToken(user),
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    user: { id: user.id, phone: user.phone, email: user.email },
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

export async function createAuthSession(
  res: Response,
  user: Pick<User, 'id' | 'email' | 'phone'>,
) {
  const refreshToken = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.authSession.create({
    data: {
      user_id: user.id,
      refresh_token_hash: hashRefreshToken(refreshToken),
      expires_at: expiresAt,
    },
  });
  setRefreshCookie(res, refreshToken);

  return createSessionResponse(user);
}

export async function rotateAuthSession(req: Request, res: Response) {
  const refreshToken = readRefreshCookie(req);
  if (!refreshToken) return null;

  const currentHash = hashRefreshToken(refreshToken);
  const now = new Date();
  const storedSession = await prisma.authSession.findUnique({
    where: { refresh_token_hash: currentHash },
    include: { user: true },
  });

  if (
    !storedSession ||
    storedSession.revoked_at ||
    storedSession.expires_at <= now ||
    !storedSession.user.is_active
  ) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return null;
  }

  const nextToken = randomBytes(48).toString('base64url');
  const nextExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const rotation = await prisma.authSession.updateMany({
    where: {
      id: storedSession.id,
      refresh_token_hash: currentHash,
      revoked_at: null,
      expires_at: { gt: now },
    },
    data: {
      refresh_token_hash: hashRefreshToken(nextToken),
      expires_at: nextExpiresAt,
      last_used_at: now,
    },
  });

  if (rotation.count !== 1) {
    const latestSession = await prisma.authSession.findUnique({
      where: { id: storedSession.id },
      include: { user: true },
    });
    if (
      latestSession &&
      latestSession.refresh_token_hash !== currentHash &&
      !latestSession.revoked_at &&
      latestSession.expires_at > now &&
      latestSession.user.is_active
    ) {
      return {
        user: latestSession.user,
        session: createSessionResponse(latestSession.user),
      };
    }

    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return null;
  }

  setRefreshCookie(res, nextToken);
  return {
    user: storedSession.user,
    session: createSessionResponse(storedSession.user),
  };
}

export async function revokeAuthSession(req: Request, res: Response): Promise<void> {
  const refreshToken = readRefreshCookie(req);
  if (refreshToken) {
    await prisma.authSession.updateMany({
      where: {
        refresh_token_hash: hashRefreshToken(refreshToken),
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });
  }
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}
