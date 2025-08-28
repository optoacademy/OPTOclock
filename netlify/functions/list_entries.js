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
    const user_id = params.get('user_id');
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
    
    if (!user_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'user_id es requerido' })
      };
    }
    
    const supabase = createSupabaseClient();
    
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
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
        entries: entries || [],
        count: entries?.length || 0
      })
    };
    
  } catch (error) {
    console.error('List entries error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
}