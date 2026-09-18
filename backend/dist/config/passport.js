import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';
import { prisma } from '../utils/prisma.js';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || '';
const jwksProvider = jwksRsa.passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: SUPABASE_JWKS_URL
});
const customSecretProvider = (request, rawJwtToken, done) => {
    try {
        const decoded = jwt.decode(rawJwtToken, { complete: true });
        if (!decoded || typeof decoded === 'string') {
            return done(new Error('Invalid token'), null);
        }
        if (decoded.header.alg === 'HS256') {
            const secret = process.env.JWT_SECRET || 'fallback_development_secret';
            return done(null, secret);
        }
        else if (decoded.header.alg === 'RS256') {
            return jwksProvider(request, rawJwtToken, done);
        }
        else {
            return done(new Error('Unsupported algorithm'), null);
        }
    }
    catch (err) {
        return done(err, null);
    }
};
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKeyProvider: customSecretProvider,
    algorithms: ['RS256', 'HS256']
};
passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
        // jwt_payload.sub contains the Supabase auth.users.id
        const user = await prisma.user.findUnique({
            where: { id: jwt_payload.sub }
        });
        if (user && user.is_active) {
            return done(null, user);
        }
        return done(null, false);
    }
    catch (error) {
        return done(error, false);
    }
}));
export default passport;
//# sourceMappingURL=passport.js.map