import { prisma } from '../utils/prisma.js';
import { supabase } from '../utils/supabase.js';
import { sendOTP } from '../services/sms.service.js';
import jwt from 'jsonwebtoken';
// In-memory OTP store (for MVP)
// Format: { "+919999999999": { otp: "123456", expiresAt: 1690000000, role: "customer" } }
const otpStore = new Map();
export const sendOtp = async (req, res) => {
    const { phone, role } = req.body;
    if (!phone) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Phone number is required' } });
        return;
    }
    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        otpStore.set(phone, { otp, expiresAt, role });
        // Send via BlackSMS
        const sent = await sendOTP(phone, otp);
        if (sent) {
            res.json({ success: true, message: 'OTP sent successfully' });
        }
        else {
            res.status(500).json({ success: false, error: { code: 'SMS_FAILED', message: 'Failed to send OTP SMS' } });
        }
    }
    catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
};
export const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Phone and OTP are required' } });
        return;
    }
    const record = otpStore.get(phone);
    if (!record || record.otp !== otp) {
        res.status(401).json({ success: false, error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });
        return;
    }
    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        res.status(401).json({ success: false, error: { code: 'EXPIRED_OTP', message: 'OTP has expired' } });
        return;
    }
    // OTP is valid, clear it
    otpStore.delete(phone);
    try {
        // Determine user role (default to customer if not specified during sendOtp)
        const role = record.role || 'customer';
        // 1. Check if user exists in Supabase by phone
        // We can't directly list by phone with the generic admin API easily, so we'll check our DB first
        let dbUser = await prisma.user.findFirst({ where: { phone } });
        let supabaseUserId = dbUser?.id;
        if (!dbUser) {
            // Create user in Supabase auth
            // We generate a dummy email since Supabase requires it or unique phone (phone can be tricky with formatting)
            // Actually, Supabase allows phone-only users if configured, but let's use a dummy email to be safe
            const dummyEmail = `${phone.replace('+', '')}@tastifyy.app`;
            const dummyPassword = Math.random().toString(36).slice(-10) + 'A1!'; // Secure random password
            const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
                email: dummyEmail,
                phone: phone,
                password: dummyPassword,
                email_confirm: true,
                phone_confirm: true
            });
            if (adminError) {
                console.error("Supabase create user error:", adminError);
                res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Failed to create user in identity provider' } });
                return;
            }
            supabaseUserId = adminData.user.id;
            // Create in our DB
            dbUser = await prisma.user.create({
                data: {
                    id: supabaseUserId,
                    phone,
                    email: dummyEmail,
                    name: 'Tastifyy User', // Placeholder, can be updated later
                    role: role
                }
            });
        }
        if (!dbUser.is_active) {
            res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' } });
            return;
        }
        // We need to generate a custom JWT that matches what our Passport JWT strategy expects
        // The passport strategy checks the Supabase JWT. 
        // Since we verified the OTP manually, we can generate a session using supabase admin
        // Or we can generate a custom JWT using the Supabase JWT secret so it passes the middleware
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("SUPABASE_JWT_SECRET is missing");
        }
        const token = jwt.sign({
            sub: dbUser.id,
            aud: "authenticated",
            role: "authenticated",
            email: dbUser.email,
            phone: dbUser.phone
        }, jwtSecret, { expiresIn: '7d' });
        res.json({
            success: true,
            user: dbUser,
            session: {
                access_token: token,
                token_type: 'bearer',
                expires_in: 7 * 24 * 60 * 60,
                user: { id: dbUser.id, phone: dbUser.phone, email: dbUser.email }
            }
        });
    }
    catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during verification' } });
    }
};
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