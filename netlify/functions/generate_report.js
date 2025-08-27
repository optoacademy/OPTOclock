import { createSupabaseClient, corsHeaders } from './_helpers.js';
import PDFDocument from 'pdfkit';

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
    const SUPER_ADMIN_EMAIL = 'epiblue@gmail.com'; // This should be an env var

    let companyName = 'Todos los fichajes';
    let query = supabase.from('time_entries').select('*').order('timestamp', { ascending: false });

    if (admin_email !== SUPER_ADMIN_EMAIL) {
      const { data: adminUser, error: adminError } = await supabase.from('users').select('company').eq('email', admin_email).maybeSingle();
      if (adminError || !adminUser) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
      }
      companyName = adminUser.company;
      query = query.eq('company', companyName);
    }

    const { data: entries, error: entriesError } = await query;
    if (entriesError) throw entriesError;

    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // PDF content generation
    doc.fontSize(20).text(`Informe de Fichajes: ${companyName}`, { align: 'center' });
    doc.moveDown();

    const tableTop = doc.y;
    const item = entries[0] || {};
    const headers = ['Empleado', 'Fecha', 'Hora', 'Tipo'];
    const colWidths = [150, 100, 100, 100];

    // Table Header
    doc.fontSize(12);
    let currentX = doc.x;
    headers.forEach((header, i) => {
        doc.text(header, currentX, tableTop, { width: colWidths[i], align: 'left' });
        currentX += colWidths[i];
    });
    doc.y = tableTop + 20;
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Table Rows
    doc.fontSize(10);
    entries.forEach(entry => {
        const row = [entry.user_name, entry.date_es, entry.time_es, entry.entry_type];
        let currentX = doc.x;
        const y = doc.y;
        row.forEach((text, i) => {
            doc.text(text, currentX, y, { width: colWidths[i], align: 'left' });
            currentX += colWidths[i];
        });
        doc.moveDown();
    });

    return new Promise((resolve) => {
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve({
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="reporte-${companyName.toLowerCase().replace(/\s/g, '-')}.pdf"`
                },
                body: pdfData.toString('base64'),
                isBase64Encoded: true,
            });
        });
        doc.end();
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
}
