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
    const supabase = createSupabaseClient();
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, company, position, is_admin, created_at')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('Users error:', usersError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Error obteniendo usuarios' })
      };
    }
    
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (entriesError) {
      console.error('Entries error:', entriesError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Error obteniendo fichajes' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        users: users || [],
        entries: entries || []
      })
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