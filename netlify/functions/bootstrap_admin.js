import { createSupabaseClient, corsHeaders } from './_helpers.js';
import crypto from 'crypto';

async function scryptHash(password) {
  const salt = crypto.randomBytes(16);
  const dk = await new Promise((res, rej) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => err ? rej(err) : res(key))
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
    const { full_name, email, password, company = 'visionacademy', position = 'Admin' } = body;
    if (!full_name || !email || !password) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan datos' }) };
    }

    const supabase = createSupabaseClient();

    // Solo si NO hay admins aún
    const { count, error: countError } = await supabase.from('admins').select('email', { count: 'exact', head: true });
    if (countError) throw countError;
    if ((count ?? 0) > 0) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Ya existe admin' }) };
    }

    // Crear usuario admin
    const { password_hash, password_salt } = await scryptHash(password);
    const userRow = { email, password_hash, password_salt, full_name, company, position, is_admin: true };
    const { data: user, error: userError } = await supabase.from('users').insert(userRow).select().maybeSingle();
    if (userError) throw userError;

    // Registrar email en admins
    const { error: adminError } = await supabase.from('admins').insert({ email });
    if (adminError) throw adminError;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, user }) };
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
