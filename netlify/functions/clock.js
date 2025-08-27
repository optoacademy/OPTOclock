import { createSupabaseClient, corsHeaders } from './_helpers.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { user_id, user_name, company, entry_type, date_es, time_es } = body;
    
    if (!user_id || !user_name || !company || !entry_type || !date_es || !time_es) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Todos los campos son requeridos' })
      };
    }
    
    if (!['eyecare', 'visionacademy'].includes(company.toLowerCase())) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Empresa no válida' })
      };
    }
    
    if (!['entrada', 'salida'].includes(entry_type)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Tipo de entrada no válido' })
      };
    }
    
    const supabase = createSupabaseClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();
    
    if (userError || !user) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }
    
    const entryRow = {
      user_id,
      user_name,
      company: company.toLowerCase(),
      entry_type,
      date_es,
      time_es,
      timestamp: new Date().toISOString()
    };
    
    const { data: newEntry, error: insertError } = await supabase
      .from('time_entries')
      .insert(entryRow)
      .select()
      .maybeSingle();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Error registrando fichaje' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        entry: newEntry,
        message: `${entry_type === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`
      })
    };
    
  } catch (error) {
    console.error('Clock error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
}