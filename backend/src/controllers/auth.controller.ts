import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { supabase } from '../utils/supabase.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, phone, name, role } = req.body;

  if (!email || !password || !phone || !name || !role) {
    res.status(400).json({ error: 'Email, password, phone, name, and role are required' });
    return;
  }

  try {
    // 1. Create user in Supabase Auth (prevents duplicate emails natively)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    if (!authData.user) {
      res.status(400).json({ error: 'Email already registered or requires confirmation. Try logging in.' });
      return;
    }

    // 2. Create the corresponding user record in our Prisma database
    // We use the Supabase Auth UUID as our primary key so they stay synced.
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        phone,
        name,
        role
      }
    });

    res.status(201).json({ message: 'Registration successful', user, session: authData.session });
  } catch (error: any) {
    console.error('Registration Error:', error);
    // Handle Prisma unique constraint errors (e.g. phone already exists)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A user with this phone number already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error during registration', details: error.message || String(error) });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    res.status(400).json({ error: 'Email, password, and role are required' });
    return;
  }

  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!authData.user || !authData.session) {
      res.status(500).json({ error: 'Failed to retrieve session from Supabase' });
      return;
    }

    // 2. Verify the role in our database
    const user = await prisma.user.findUnique({
      where: { id: authData.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User profile not found in database' });
      return;
    }

    if (user.role !== role) {
      res.status(403).json({ error: `Account is registered as a ${user.role}. Cannot login as ${role}.` });
      return;
    }

    // 3. Return the user profile and the Supabase JWT session
    // The client will use `authData.session.access_token` for Bearer auth
    res.json({
      message: 'Login successful',
      user,
      session: authData.session,
      token: authData.session.access_token // For backward compatibility with existing frontends during transition
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};
