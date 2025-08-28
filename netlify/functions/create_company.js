import { createSupabaseClient, corsHeaders } from './_helpers.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { company_name, admin_email } = body;
    if (!company_name || !admin_email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos' }) };
    }

    const SUPER_ADMIN_EMAIL = 'epiblue@gmail.com'; // This should be an env var
    if (admin_email !== SUPER_ADMIN_EMAIL) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('companies').insert({ name: company_name }).select().single();

    if (error) throw error;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, company: data }) };
  } catch (error) {
    console.error('Create company error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
