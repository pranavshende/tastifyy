import { prismaMock } from './__mocks__/prisma.js';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/utils/prisma.js', () => ({
  prisma: prismaMock,
}));

// Also mock Supabase since we don't want real auth calls
jest.unstable_mockModule('../src/utils/supabase.js', () => ({
  supabase: {
    auth: {
      admin: {
        createUser: jest.fn<() => Promise<{ data: { user: { id: string } }; error: null }>>()
          .mockResolvedValue({ data: { user: { id: 'test-uuid' } }, error: null })
      },
      signInWithPassword: jest.fn<() => Promise<{ data: { user: { id: string }; session: { access_token: string } }; error: null }>>()
        .mockResolvedValue({ 
          data: { 
            user: { id: 'test-uuid' },
            session: { access_token: 'fake-token' } 
          }, 
          error: null 
        }),
      getUser: jest.fn<() => Promise<{ data: { user: { id: string } | null }; error: null }>>()
        .mockImplementation(async (token?: string) => {
          if (token === 'fake-admin-token') {
            return { data: { user: { id: 'admin-user-id' } }, error: null };
          }
          if (token === 'fake-delivery-token') {
            return { data: { user: { id: 'delivery-user-id' } }, error: null };
          }
          return { data: { user: null }, error: { message: 'Invalid token' } as any };
        })
    }
  }
}));

// Mock Socket.io
jest.unstable_mockModule('../src/socket.js', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  })
}));
