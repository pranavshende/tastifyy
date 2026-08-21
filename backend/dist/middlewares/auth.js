import { supabase } from '../utils/supabase.js';
import { prisma } from '../utils/prisma.js';
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (error || !supabaseUser) {
            console.log('Supabase Auth Failed:', error?.message);
            res.status(401).json({ error: 'Unauthorized: Invalid token or session expired', details: error?.message });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
        if (!user) {
            res.status(401).json({ error: 'Unauthorized: User not found in database' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error('Authentication Error:', err);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};
export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
            return;
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map