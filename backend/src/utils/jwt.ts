import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  return secret || 'fallback_development_secret';
}

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), {
    expiresIn: '15m',
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret());
};
