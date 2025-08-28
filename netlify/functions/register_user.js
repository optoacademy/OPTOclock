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
    const { admin_email, full_name, email, password, company_id, position, is_admin = false } = body;
    if (!admin_email || !full_name || !email || !password || !company_id || !position) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos' }) };
    }

    const supabase = createSupabaseClient();
    const SUPER_ADMIN_EMAIL = 'epiblue@gmail.com'; // This should be an env var

    // Authorize the request
    let requesterIsSuperAdmin = admin_email === SUPER_ADMIN_EMAIL;
    let requesterIsCompanyAdmin = false;

    if (!requesterIsSuperAdmin) {
      const { data: adminUser, error: adminError } = await supabase.from('users').select('is_admin, company_id').eq('email', admin_email).maybeSingle();
      if (adminError) throw adminError;
      if (adminUser && adminUser.is_admin && adminUser.company_id == company_id) {
        requesterIsCompanyAdmin = true;
      }
    }

    if (!requesterIsSuperAdmin && !requesterIsCompanyAdmin) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    if (requesterIsCompanyAdmin && is_admin) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No tienes permisos para crear administradores' }) };
    }

    const { data: existingUser, error: existingUserError } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existingUserError) throw existingUserError;
    if (existingUser) {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Ese email ya existe' }) };
    }

    const { password_hash, password_salt } = await scryptHash(password);
    const userRow = { email, password_hash, password_salt, full_name, company_id, position, is_admin };
    const { data: user, error: userError } = await supabase.from('users').insert(userRow).select().single();
    if (userError) throw userError;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, user }) };
  } catch (error) {
    console.error('Register user error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
