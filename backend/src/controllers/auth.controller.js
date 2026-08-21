import { prisma } from '../utils/prisma.js';
import { supabase } from '../utils/supabase.js';
export const register = async (req, res) => {
    const { email, password, phone, name, role } = req.body;
    if (!email || !password || !phone || !name || !role) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email, password, phone, name, and role are required' } });
        return;
    }
    // Block self-registration of admin accounts
    if (role === 'admin') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin accounts cannot be self-registered' } });
        return;
    }
    try {
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (adminError) {
            res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: adminError.message } });
            return;
        }
        if (!adminData.user) {
            res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Failed to create user. Email may already be registered.' } });
            return;
        }
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError || !authData.session) {
            res.status(500).json({ success: false, error: { code: 'SESSION_ERROR', message: 'User created but failed to generate session.' } });
            return;
        }
        const user = await prisma.user.create({
            data: { id: authData.user.id, email, phone, name, role }
        });
        res.status(201).json({ success: true, user, session: authData.session });
    }
    catch (error) {
        console.error('Registration Error:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: 'A user with this phone or email already exists' } });
            return;
        }
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during registration' } });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
        return;
    }
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } });
            return;
        }
        if (!authData.user || !authData.session) {
            res.status(500).json({ success: false, error: { code: 'SESSION_ERROR', message: 'Failed to retrieve session' } });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: authData.user.id } });
        if (!user) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } });
            return;
        }
        if (!user.is_active) {
            res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Contact support.' } });
            return;
        }
        res.json({ success: true, user, session: authData.session });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during login' } });
    }
};
// GET /auth/me — validate session and return full user profile + role
export const me = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (error || !supabaseUser) {
            res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid. Please log in again.' } });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
        if (!user) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } });
            return;
        }
        if (!user.is_active) {
            res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' } });
            return;
        }
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Me Error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
};
// POST /auth/logout
export const logout = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // Best-effort sign out — invalidates the refresh token on Supabase
        if (token) {
            try {
                await supabase.auth.admin.signOut(token);
            }
            catch (_) { }
        }
    }
    res.json({ success: true, message: 'Logged out successfully' });
};
//# sourceMappingURL=auth.controller.js.map