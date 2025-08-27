import { createSupabaseClient, corsHeaders } from './_helpers.js';
import crypto from 'crypto';

async function scryptHash(password) {
  const salt = crypto.randomBytes(16);
  const dk = await new Promise((res, rej) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (e, d) => e ? rej(e) : res(d))
  );
  return { password_hash: dk.toString('hex'), password_salt: salt.toString('hex') };
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
    const { admin_email, full_name, email, password, company, position } = body;
    if (!admin_email || !full_name || !email || !password || !company || !position) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos' }) };
    }

    const supabase = createSupabaseClient();

    const { data: admin, error: adminError } = await supabase.from('admins').select('email').eq('email', admin_email).maybeSingle();
    if (adminError) throw adminError;
    if (!admin) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const { data: existingUser, error: existingUserError } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existingUserError) throw existingUserError;
    if (existingUser) {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Ese email ya existe' }) };
    }

    const { password_hash, password_salt } = await scryptHash(password);
    const userRow = { email, password_hash, password_salt, full_name, company, position, is_admin: false };
    const { data: user, error: userError } = await supabase.from('users').insert(userRow).select().maybeSingle();
    if (userError) throw userError;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, user }) };
  } catch (error) {
    console.error('Register user error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
