import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { supabase } from '../utils/supabase.js';
import { sendOTP } from '../services/sms.service.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getPublicUrl, uploadFile, validateFile, generateFilename } from '../services/storage.service.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory OTP store (for MVP)
// Format: { "+919999999999": { otp: "123456", expiresAt: 1690000000, role: "customer" } }
const otpStore = new Map<string, { otp: string; expiresAt: number; role?: string }>();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
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
    } else {
      res.status(500).json({ success: false, error: { code: 'SMS_FAILED', message: 'Failed to send OTP SMS' } });
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
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
          role: role as any
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
    const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret';

    const token = jwt.sign(
      { 
        sub: dbUser.id,
        aud: "authenticated",
        role: "authenticated",
        email: dbUser.email,
        phone: dbUser.phone
      }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      user: { ...dbUser, profile_photo_url: getPublicUrl(dbUser.profile_photo_url) }, 
      session: { 
        access_token: token, 
        token_type: 'bearer',
        expires_in: 7 * 24 * 60 * 60,
        user: { id: dbUser.id, phone: dbUser.phone, email: dbUser.email }
      } 
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during verification' } });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, phone, name, role, dob, address_line, city, state, pincode } = req.body;
  const file = req.file;

  if (!email || !password || !phone || !name || !role) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email, password, phone, name, and role are required' } });
    return;
  }

  // Block self-registration of admin accounts
  if (role === 'admin') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin accounts cannot be self-registered' } });
    return;
  }

  if (file) {
    const validation = validateFile(file.buffer, file.mimetype, file.size);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
      return;
    }
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

    let profile_photo_url = null;
    if (file) {
      const filename = generateFilename(file.originalname, 'profile');
      const uploadRes = await uploadFile(authData.user.id, 'profile', filename, file.buffer, file.mimetype);
      profile_photo_url = uploadRes.path;
    }

    const parsedDob = dob ? new Date(dob) : null;

    const user = await prisma.user.create({
      data: { 
        id: authData.user.id, 
        email, 
        phone, 
        name, 
        role,
        dob: parsedDob,
        profile_photo_url
      }
    });

    if (address_line && city && state && pincode) {
      await prisma.address.create({
        data: {
          user_id: user.id,
          label: 'home',
          address_line,
          city,
          state,
          pincode,
          latitude: 0,
          longitude: 0,
          is_default: true
        }
      });
    }

    res.status(201).json({ 
      success: true, 
      user: { ...user, profile_photo_url: getPublicUrl(user.profile_photo_url) }, 
      session: authData.session 
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: 'A user with this phone or email already exists' } });
      return;
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during registration' } });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
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

    res.json({ 
      success: true, 
      user: { ...user, profile_photo_url: getPublicUrl(user.profile_photo_url) }, 
      session: authData.session 
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during login' } });
  }
};

// GET /auth/me — validate session and return full user profile + role
export const me = async (req: Request, res: Response): Promise<void> => {
  // auth.routes.ts now uses `authenticate` middleware which populates req.user
  const user = req.user as any;
  if (user && user.profile_photo_url) {
    user.profile_photo_url = getPublicUrl(user.profile_photo_url);
  }
  res.json({ success: true, user });
};

// POST /auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Best-effort sign out — invalidates the refresh token on Supabase
    if (token) {
      try { await supabase.auth.admin.signOut(token); } catch (_) {}
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

// POST /auth/google
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Google credential is required' } });
    return;
  }

  try {
    const decoded = jwt.decode(credential) as any;
    const audience = decoded?.aud || process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';

    const ticket: any = await googleClient.verifyIdToken({
      idToken: credential,
      audience: audience,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid Google token' } });
      return;
    }

    const { email, name, sub: googleId, picture } = payload;

    // Check if user exists in our DB
    let dbUser = await prisma.user.findUnique({ where: { email } });

    let supabaseUserId = dbUser?.id;

    if (!dbUser) {
      // For compatibility, create a dummy user in Supabase auth (since middleware expects a valid sub)
      // Or just create it directly in prisma with the googleId.
      const dummyPassword = Math.random().toString(36).slice(-10) + 'A1!'; 
      
      let { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: email,
        password: dummyPassword,
        email_confirm: true
      });

      if (adminError && (adminError.code === 'email_exists' || adminError.message?.includes('already been registered'))) {
        // Attempt to find the orphaned Supabase user
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData?.users?.find(u => u.email === email);
        if (existingUser) {
          adminData = { user: existingUser } as any;
          adminError = null;
        }
      }

      if (adminError) {
        console.error("Supabase create user error:", adminError);
        res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Failed to create user in identity provider' } });
        return;
      }

      if (!adminData?.user) {
        console.error("Supabase create user error: user is null");
        res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Failed to retrieve user ID from identity provider' } });
        return;
      }

      supabaseUserId = adminData.user.id;

      // Generate a dummy phone that is strictly under 15 characters
      // +91 (3) + 00000 (5) + 6 random digits = 14 characters
      const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
      const dummyPhone = '+9100000' + randomDigits;

      dbUser = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          name: name || 'Google User',
          phone: dummyPhone,
          role: 'customer',
          profile_photo_url: picture
        }
      });
    }

    if (!dbUser.is_active) {
      res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' } });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret';

    const token = jwt.sign(
      { 
        sub: dbUser.id,
        aud: "authenticated",
        role: "authenticated",
        email: dbUser.email,
        phone: dbUser.phone
      }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      user: { ...dbUser, profile_photo_url: getPublicUrl(dbUser.profile_photo_url) }, 
      session: { 
        access_token: token, 
        token_type: 'bearer',
        expires_in: 7 * 24 * 60 * 60,
        user: { id: dbUser.id, phone: dbUser.phone, email: dbUser.email }
      } 
    });

  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during Google login' } });
  }
};
