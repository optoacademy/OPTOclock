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
    const { user_id_to_delete, admin_email } = body;
    if (!user_id_to_delete || !admin_email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos' }) };
    }

    const supabase = createSupabaseClient();

    // Get admin user details
    const { data: adminUser, error: adminError } = await supabase.from('users').select('company_id, is_admin').eq('email', admin_email).single();
    if (adminError || !adminUser || !adminUser.is_admin) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    // Get target user details
    const { data: targetUser, error: targetUserError } = await supabase.from('users').select('company_id').eq('id', user_id_to_delete).single();
    if (targetUserError) {
        return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Usuario a eliminar no encontrado' }) };
    }

    // Check if admin and user are in the same company
    if (adminUser.company_id !== targetUser.company_id) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No puedes eliminar usuarios de otras empresas' }) };
    }

    // Delete the user
    const { error: deleteError } = await supabase.from('users').delete().eq('id', user_id_to_delete);
    if (deleteError) throw deleteError;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, message: 'Usuario eliminado correctamente' }),
    };

  } catch (error) {
    console.error('Delete user error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
