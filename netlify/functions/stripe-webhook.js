import { createSupabaseClient } from './_helpers.js';
import Stripe from 'stripe';

export async function handler(event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createSupabaseClient();
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object;
      const companyId = session.metadata.company_id;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      // Get subscription details to find the status
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update company with subscription details
      const { error } = await supabase
        .from('companies')
        .update({
          stripe_customer_id: customerId,
          subscription_id: subscriptionId,
          subscription_status: subscription.status,
        })
        .eq('id', companyId);

      if (error) {
        console.error('Error updating company on checkout completion:', error);
        return { statusCode: 500, body: 'Database error' };
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object;
      const subscriptionId = subscription.id;
      const newStatus = subscription.status;

      const { error } = await supabase
        .from('companies')
        .update({ subscription_status: newStatus })
        .eq('subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating subscription status:', error);
        return { statusCode: 500, body: 'Database error' };
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
}
