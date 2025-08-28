import { createSupabaseClient, corsHeaders } from './_helpers.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const params = new URLSearchParams(event.rawQuery || '');
    const admin_email = params.get('admin_email');
    if (!admin_email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Falta el email del admin' }) };
    }

    const supabase = createSupabaseClient();

    const { data: adminUser, error: adminError } = await supabase.from('users').select('company_id, is_admin').eq('email', admin_email).single();
    if (adminError || !adminUser || !adminUser.is_admin) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, position')
      .eq('company_id', adminUser.company_id)
      .neq('email', admin_email); // Exclude the admin themselves

    if (usersError) throw usersError;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, users: users || [] }),
    };

  } catch (error) {
    console.error('List users error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
