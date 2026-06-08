import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { listingId, type, quantity } = body;

    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = listings[0];
    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    let amount, name, description;

    if (type === 'share') {
      amount = listing.sharePrice * 100 * (quantity || 1); // Stripe uses cents
      name = `${listing.title} - ${quantity || 1} Share${quantity > 1 ? 's' : ''}`;
      description = `Purchase ${quantity || 1} share(s) at $${listing.sharePrice} each`;
    } else if (type === 'ownership') {
      amount = listing.fullPrice * 100;
      name = `${listing.title} - Full Ownership`;
      description = `Purchase full ownership of ${listing.title}`;
    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'mode': 'payment',
        'success_url': `https://share-saas-hq.base44.app/investments`,
        'cancel_url': `https://share-saas-hq.base44.app/marketplace`,
        'metadata[base44_app_id]': Deno.env.get('BASE44_APP_ID') || '',
        'metadata[listingId]': listingId,
        'metadata[type]': type,
        'metadata[quantity]': String(quantity || 1),
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': name,
        'line_items[0][price_data][product_data][description]': description,
        'line_items[0][price_data][unit_amount]': String(amount),
        'line_items[0][quantity]': '1',
      }),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return Response.json({ error: session.error.message }, { status: 400 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});