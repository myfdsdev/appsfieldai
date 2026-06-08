import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const sig = req.headers.get('stripe-signature');

    if (!sig || !stripeKey) {
      return Response.json({ error: 'Missing signature or key' }, { status: 400 });
    }

    const body = await req.text();
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verify webhook signature
    let event;
    try {
      // Using Stripe's library for verification
      const { default: Stripe } = await import('npm:stripe@17.7.0');
      const stripe = new Stripe(stripeKey);
      event = await stripe.webhooks.constructEventAsync(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    if (event.type !== 'checkout.session.completed') {
      return Response.json({ received: true });
    }

    const session = event.data.object;
    const metadata = session.metadata || {};
    const { listingId, type, quantity } = metadata;
    const amountPaid = session.amount_total / 100; // Convert cents to dollars

    if (!listingId || !type) {
      console.error('Missing metadata in session');
      return Response.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Get the listing
    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = listings[0];
    if (!listing) {
      console.error('Listing not found:', listingId);
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const qty = parseInt(quantity) || 1;

    if (type === 'share') {
      // Update sold shares
      await base44.asServiceRole.entities.SaaSListing.update(listingId, {
        soldShares: (listing.soldShares || 0) + qty,
      });

      // Create SharePurchase record
      await base44.asServiceRole.entities.SharePurchase.create({
        userId: listing.ownerUserId || 'guest',
        listingId,
        sharesBought: qty,
        pricePerShare: listing.sharePrice,
        totalAmount: amountPaid,
      });

      // Create Transaction
      await base44.asServiceRole.entities.Transaction.create({
        userId: listing.ownerUserId || 'guest',
        type: 'share_purchase',
        amount: amountPaid,
        listingId,
        status: 'completed',
      });

      console.log(`Share purchase: ${qty} shares of ${listing.title} for $${amountPaid}`);
    } else if (type === 'ownership') {
      // Mark as sold
      await base44.asServiceRole.entities.SaaSListing.update(listingId, {
        status: 'sold',
        soldShares: listing.totalShares,
      });

      // Create OwnershipPurchase record
      await base44.asServiceRole.entities.OwnershipPurchase.create({
        userId: listing.ownerUserId || 'guest',
        listingId,
        fullPrice: amountPaid,
      });

      // Create Transaction
      await base44.asServiceRole.entities.Transaction.create({
        userId: listing.ownerUserId || 'guest',
        type: 'ownership_purchase',
        amount: amountPaid,
        listingId,
        status: 'completed',
      });

      console.log(`Full ownership purchase: ${listing.title} for $${amountPaid}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});