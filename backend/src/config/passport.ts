import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';
import { prisma } from '../utils/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || '';

const options: any = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKeyProvider: jwksRsa.passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: SUPABASE_JWKS_URL
  }),
  issuer: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/auth/v1` : undefined,
  algorithms: ['RS256']
};

passport.use(
  new JwtStrategy(options, async (jwt_payload: any, done: any) => {
    try {
      // jwt_payload.sub contains the Supabase auth.users.id
      const user = await prisma.user.findUnique({
        where: { id: jwt_payload.sub }
      });

      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
