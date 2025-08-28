import { createSupabaseClient, corsHeaders } from './_helpers.js';
import Stripe from 'stripe';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { company_id, admin_email } = body;
    if (!company_id || !admin_email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos' }) };
    }

    // Authorize Super Admin
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'epiblue@gmail.com';
    if (admin_email !== SUPER_ADMIN_EMAIL) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const supabase = createSupabaseClient();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get company details
    const { data: company, error: companyError } = await supabase.from('companies').select('*').eq('id', company_id).single();
    if (companyError) throw new Error('Empresa no encontrada.');

    let customerId = company.stripe_customer_id;

    // If company is not yet a Stripe customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        metadata: {
          company_id: company.id,
        },
      });
      customerId = customer.id;

      // Save the new customer ID in our database
      const { error: updateError } = await supabase.from('companies').update({ stripe_customer_id: customerId }).eq('id', company.id);
      if (updateError) throw new Error('Error al actualizar la empresa con el ID de cliente de Stripe.');
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
        throw new Error('La variable STRIPE_PRICE_ID no está configurada en Netlify.');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${event.headers.origin}/super-admin.html?payment=success`,
      cancel_url: `${event.headers.origin}/super-admin.html?payment=cancelled`,
      // metadata to link session to our company
      metadata: {
        company_id: company.id,
      }
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sessionId: session.id }),
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message || 'Error interno del servidor' }) };
  }
}
