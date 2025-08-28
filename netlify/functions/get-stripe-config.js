import { corsHeaders } from './_helpers.js';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  };
}
