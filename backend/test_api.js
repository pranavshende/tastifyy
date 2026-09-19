import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function test() {
  console.log('Signing up a test user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test_addresses@example.com',
    password: 'password123'
  });

  if (authError && authError.message !== 'User already registered') {
    console.error('Signup error:', authError);
    return;
  }

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test_addresses@example.com',
    password: 'password123'
  });

  if (loginError) {
    console.error('Login error:', loginError);
    return;
  }

  const token = loginData.session.access_token;
  console.log('Got token, length:', token.length);

  try {
    const res = await axios.get('https://tastifyy.onrender.com/api/customer/addresses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Addresses response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.log('Addresses error response:', err.response.status, err.response.data);
    } else {
      console.log('Addresses error:', err.message);
    }
  }

  try {
    const res2 = await axios.get('https://tastifyy.onrender.com/api/customer/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Profile response:', res2.status, res2.data);
  } catch (err) {
    if (err.response) {
      console.log('Profile error response:', err.response.status, err.response.data);
    } else {
      console.log('Profile error:', err.message);
    }
  }
}

test();
