import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { jest } from '@jest/globals';
import { prismaMock } from './__mocks__/prisma.js';

describe('Persistent authentication sessions', () => {
  let createAuthSession: typeof import('../src/services/auth-session.service.js').createAuthSession;
  let rotateAuthSession: typeof import('../src/services/auth-session.service.js').rotateAuthSession;

  beforeAll(async () => {
    ({ createAuthSession, rotateAuthSession } = await import('../src/services/auth-session.service.js'));
  });

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    jest.clearAllMocks();
  });

  it('stores only a hash of the refresh token and issues an HttpOnly cookie', async () => {
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;
    const user = { id: 'user-1', email: 'user@example.com', phone: '+911234567890' };

    await createAuthSession(response, user);

    const rawRefreshToken = (response.cookie as jest.Mock).mock.calls[0][1] as string;
    const storedHash = prismaMock.authSession.create.mock.calls[0][0].data.refresh_token_hash;
    expect(storedHash).toBe(createHash('sha256').update(rawRefreshToken).digest('hex'));
    expect(storedHash).not.toBe(rawRefreshToken);
    expect(response.cookie).toHaveBeenCalledWith(
      'tastifyy_refresh',
      rawRefreshToken,
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('rotates a valid refresh token and returns a short-lived access token', async () => {
    const rawRefreshToken = 'existing-refresh-token';
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      phone: '+911234567890',
      is_active: true,
    };
    prismaMock.authSession.findUnique.mockResolvedValue({
      id: 'session-1',
      user_id: user.id,
      refresh_token_hash: createHash('sha256').update(rawRefreshToken).digest('hex'),
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
      user,
    } as any);
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 1 } as any);
    const response = { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;
    const request = {
      headers: { cookie: `tastifyy_refresh=${rawRefreshToken}` },
    } as Request;

    const result = await rotateAuthSession(request, response);

    expect(result?.session.access_token).toEqual(expect.any(String));
    expect(prismaMock.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ refresh_token_hash: createHash('sha256').update(rawRefreshToken).digest('hex') }),
      data: expect.objectContaining({ refresh_token_hash: expect.not.stringMatching(rawRefreshToken) }),
    }));
    expect(response.cookie).toHaveBeenCalledWith(
      'tastifyy_refresh',
      expect.not.stringMatching(rawRefreshToken),
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('rejects expired sessions and clears the refresh cookie', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      id: 'session-1',
      user_id: 'user-1',
      refresh_token_hash: 'stored-hash',
      expires_at: new Date(Date.now() - 60_000),
      revoked_at: null,
      user: { id: 'user-1', email: 'user@example.com', phone: '+911234567890', is_active: true },
    } as any);
    const response = { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;
    const request = { headers: { cookie: 'tastifyy_refresh=expired-token' } } as Request;

    await expect(rotateAuthSession(request, response)).resolves.toBeNull();
    expect(response.clearCookie).toHaveBeenCalledWith(
      'tastifyy_refresh',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(prismaMock.authSession.updateMany).not.toHaveBeenCalled();
  });
});
