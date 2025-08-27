import { createSupabaseClient, corsHeaders } from './_helpers.js';
import crypto from 'crypto';

async function scryptHash(password, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const dk = await new Promise((res, rej) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (e, d) => e ? rej(e) : res(d))
  );
  return { password_hash: dk.toString('hex') };
}

function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(a || '', 'hex');
  const bb = Buffer.from(b || '', 'hex');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;
    if (!email || !password) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan email/password' }) };
    }

    const supabase = createSupabaseClient();
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (userError) throw userError;
    if (!user) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
    }

    const { password_hash } = await scryptHash(password, user.password_salt);
    const ok = timingSafeEqualHex(password_hash, user.password_hash);
    if (!ok) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
    }

    // This should be an environment variable in a real application
    const SUPER_ADMIN_EMAIL = 'epiblue@gmail.com';

    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      company: user.company,
      position: user.position,
      is_admin: user.is_admin,
      is_super_admin: isSuperAdmin,
    };

    if (isSuperAdmin) {
      const { data: companies, error: companiesError } = await supabase.from('users').select('company');
      if (companiesError) throw companiesError;
      safeUser.companies = [...new Set(companies.map(c => c.company).filter(Boolean))];
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, user: safeUser }) };
  } catch (error) {
    console.error('Login error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
