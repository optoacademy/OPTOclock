import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const cors = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const supa = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function scryptHash(password) {
  const salt = crypto.randomBytes(16);
  const dk = await new Promise((res, rej) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => err ? rej(err) : res(key))
  );
  return { password_hash: dk.toString('hex'), password_salt: salt.toString('hex') };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Body inválido' }) }; }

  const { full_name, email, password, company = 'visionacademy', position = 'Admin' } = body;
  if (!full_name || !email || !password) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Faltan datos' }) };

  const s = supa();

  // Solo si NO hay admins aún
  const { count } = await s.from('admins').select('email', { count: 'exact', head: true });
  if ((count ?? 0) > 0) return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Ya existe admin' }) };

  // Crear usuario admin
  const { password_hash, password_salt } = await scryptHash(password);
  const userRow = { email, password_hash, password_salt, full_name, company, position, is_admin: true };
  const { data: user, error } = await s.from('users').insert(userRow).select().maybeSingle();
  if (error) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: error.message }) };

  // Registrar email en admins
  const { error: aErr } = await s.from('admins').insert({ email });
  if (aErr) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: aErr.message }) };

  return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, user }) };
}
