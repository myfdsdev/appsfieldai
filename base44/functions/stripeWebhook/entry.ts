import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const sig = req.headers.get('stripe-signature');
    if (!sig || !stripeKey) return Response.json({ error: 'Missing signature or key' }, { status: 400 });

    const body = await req.text();
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;
    try {
      const { default: Stripe } = await import('npm:stripe@17.7.0');
      const stripe = new Stripe(stripeKey);
      event = await stripe.webhooks.constructEventAsync(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle subscription checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.mode === 'subscription') {
        const { userId, marketplaceId, planKey } = session.metadata || {};
        console.log(`Subscription checkout: user=${userId}, plan=${planKey}, marketplace=${marketplaceId}`);
        
        if (userId) {
          // Parse planKey (e.g., "pro_monthly")
          const [planId, billingCycle] = (planKey || '').split('_');
          const planMap = {
            starter: { name: 'Starter', monthlyPrice: 49, yearlyPrice: 490 },
            pro: { name: 'Pro', monthlyPrice: 149, yearlyPrice: 1490 },
            agency: { name: 'Agency', monthlyPrice: 399, yearlyPrice: 3990 },
            enterprise: { name: 'Enterprise', monthlyPrice: 999, yearlyPrice: 9990 },
          };
          const plan = planMap[planId];
          
          if (plan) {
            const now = new Date();
            const periodEnd = new Date(now);
            if (billingCycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            else periodEnd.setMonth(periodEnd.getMonth() + 1);
            
            // Cancel existing subscriptions
            const existingSubs = await base44.asServiceRole.entities.UserSubscription.filter({ userId, status: "active" });
            for (const sub of existingSubs) {
              await base44.asServiceRole.entities.UserSubscription.update(sub.id, { status: "cancelled" });
            }
            
            // Create new subscription
            await base44.asServiceRole.entities.UserSubscription.create({
              userId,
              planId,
              planName: plan.name,
              billingCycle: billingCycle || 'monthly',
              status: "active",
              currentPeriodStart: now.toISOString(),
              currentPeriodEnd: periodEnd.toISOString(),
              stripeSubscriptionId: session.subscription || '',
            });
            
            console.log(`Created subscription for user ${userId}: ${plan.name} (${billingCycle})`);
          }
        }
        
        if (marketplaceId) {
          await base44.asServiceRole.entities.Marketplace.update(marketplaceId, { status: "active" });
        }
        return Response.json({ received: true });
      }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const { marketplaceId } = sub.metadata || {};
      console.log(`Subscription cancelled: marketplace=${marketplaceId}`);
      if (marketplaceId) {
        await base44.asServiceRole.entities.Marketplace.update(marketplaceId, { status: "suspended" });
      }
      return Response.json({ received: true });
    }

    // Only handle checkout.session.completed for one-time purchases below
    if (event.type !== 'checkout.session.completed') {
      return Response.json({ received: true });
    }

    const session = event.data.object;
    const metadata = session.metadata || {};
    const { listingId, type, quantity, userId, amount } = metadata;
    const amountPaid = session.amount_total / 100;

    // Handle wallet deposits
    if (type === 'wallet_deposit') {
      if (!userId || !amount) {
        console.error('Missing userId or amount for wallet deposit');
        return Response.json({ error: 'Missing metadata' }, { status: 400 });
      }
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      const targetUser = users[0];
      if (!targetUser) {
        console.error('User not found:', userId);
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      const depositAmount = parseFloat(amount);
      const currentBalance = targetUser.walletBalance || 0;
      await base44.asServiceRole.entities.User.update(userId, { walletBalance: currentBalance + depositAmount });
      await base44.asServiceRole.entities.Transaction.create({ userId, type: 'deposit', amount: depositAmount, status: 'completed' });
      console.log(`Wallet deposit: $${depositAmount} for user ${userId}`);
      return Response.json({ received: true });
    }

    if (!listingId || !type) {
      console.error('Missing metadata in session');
      return Response.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = listings[0];
    if (!listing) {
      console.error('Listing not found:', listingId);
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const qty = parseInt(quantity) || 1;

    if (type === 'share') {
      await base44.asServiceRole.entities.SaaSListing.update(listingId, { soldShares: (listing.soldShares || 0) + qty });
      await base44.asServiceRole.entities.SharePurchase.create({ userId: listing.ownerUserId || 'guest', listingId, sharesBought: qty, pricePerShare: listing.sharePrice, totalAmount: amountPaid });
      await base44.asServiceRole.entities.Transaction.create({ userId: listing.ownerUserId || 'guest', type: 'share_purchase', amount: amountPaid, listingId, status: 'completed' });
      console.log(`Share purchase: ${qty} shares of ${listing.softwareName} for $${amountPaid}`);
    } else if (type === 'ownership') {
      await base44.asServiceRole.entities.SaaSListing.update(listingId, { status: 'sold', soldShares: listing.totalShares });
      await base44.asServiceRole.entities.OwnershipPurchase.create({ userId: listing.ownerUserId || 'guest', listingId, fullPrice: amountPaid });
      await base44.asServiceRole.entities.Transaction.create({ userId: listing.ownerUserId || 'guest', type: 'ownership_purchase', amount: amountPaid, listingId, status: 'completed' });
      console.log(`Full ownership: ${listing.softwareName} for $${amountPaid}`);
    }

    // ═══ Commission & Payout Logic ═══
    const marketplaceId = listing.marketplaceId;
    const vendorId = listing.vendorId;
    if (marketplaceId) {
      const marketplaces = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
      const marketplace = marketplaces[0];
      if (marketplace) {
        let commissionRate = marketplace.settings?.commissionRate || 0;
        let vendorName = 'Unknown';
        if (vendorId) {
          const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendorId });
          const vendor = vendors[0];
          if (vendor) {
            vendorName = vendor.vendorName || 'Unknown';
            if (vendor.commissionRate !== undefined && vendor.commissionRate !== null) {
              commissionRate = vendor.commissionRate;
            }
          }
        }
        const commissionAmount = (amountPaid * commissionRate) / 100;
        const vendorEarning = amountPaid - commissionAmount;
        await base44.asServiceRole.entities.Order.create({
          marketplaceId, customerId: userId || 'guest', vendorId: vendorId || '',
          vendorName, softwareId: listingId, softwareName: listing.softwareName || '',
          amount: amountPaid, commissionRate, commissionAmount, vendorEarning,
          paymentGateway: 'stripe', paymentStatus: 'paid', orderStatus: 'completed',
        });
        await base44.asServiceRole.entities.Payout.create({
          marketplaceId, vendorId: vendorId || '', vendorName,
          amount: vendorEarning, status: 'pending',
        });
        if (vendorId) {
          const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendorId });
          const vendor = vendors[0];
          if (vendor) {
            await base44.asServiceRole.entities.Vendor.update(vendorId, {
              payoutBalance: (vendor.payoutBalance || 0) + vendorEarning,
              totalSales: (vendor.totalSales || 0) + amountPaid,
            });
          }
        }
        console.log(`Commission: $${commissionAmount} (${commissionRate}%), Vendor earning: $${vendorEarning}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});