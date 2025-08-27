import { createSupabaseClient, corsHeaders } from './_helpers.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const params = new URLSearchParams(event.rawQuery || '');
    const admin_email = params.get('admin_email');
    if (!admin_email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Falta el email del admin' }) };
    }

    const supabase = createSupabaseClient();
    const SUPER_ADMIN_EMAIL = 'epiblue@gmail.com'; // This should be an env var

    let query = supabase.from('time_entries').select('*').order('timestamp', { ascending: false }).limit(100);

    if (admin_email !== SUPER_ADMIN_EMAIL) {
      const { data: adminUser, error: adminError } = await supabase.from('users').select('company').eq('email', admin_email).maybeSingle();
      if (adminError || !adminUser) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
      }
      query = query.eq('company', adminUser.company);
    }

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      throw entriesError;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        entries: entries || [],
      }),
    };
    
  } catch (error) {
    console.error('Admin report error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
}