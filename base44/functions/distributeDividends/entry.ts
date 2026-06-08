import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { listingId, totalAmount, period } = body;

    if (!listingId || !totalAmount || totalAmount <= 0) {
      return Response.json({ error: 'Missing listingId or invalid amount' }, { status: 400 });
    }

    // Get the listing
    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = listings[0];
    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get all share purchases for this listing
    const purchases = await base44.asServiceRole.entities.SharePurchase.filter({ listingId });
    
    if (purchases.length === 0) {
      return Response.json({ error: 'No shareholders found' }, { status: 400 });
    }

    const totalShares = listing.totalShares || purchases.reduce((s, p) => s + p.sharesBought, 0);
    const amountPerShare = totalAmount / totalShares;

    // Track per-user totals
    const userDividends = {};
    purchases.forEach((p) => {
      const uid = p.userId;
      if (!userDividends[uid]) userDividends[uid] = 0;
      userDividends[uid] += Math.round(p.sharesBought * amountPerShare * 100) / 100;
    });

    // Credit each user's wallet
    const results = [];
    for (const [uid, dividendAmount] of Object.entries(userDividends)) {
      try {
        const userRecord = await base44.asServiceRole.entities.User.get(uid);
        const currentBalance = userRecord?.walletBalance || 0;
        await base44.asServiceRole.entities.User.update(uid, {
          walletBalance: currentBalance + dividendAmount,
        });

        // Create transaction record
        await base44.asServiceRole.entities.Transaction.create({
          userId: uid,
          type: 'dividend',
          amount: dividendAmount,
          listingId,
          status: 'completed',
        });

        results.push({ userId: uid, amount: dividendAmount, status: 'credited' });
      } catch (err) {
        results.push({ userId: uid, amount: dividendAmount, status: 'failed', error: err.message });
      }
    }

    // Create Dividend record
    await base44.asServiceRole.entities.Dividend.create({
      listingId,
      listingTitle: listing.title,
      totalAmount,
      period: period || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });

    return Response.json({
      success: true,
      listing: listing.title,
      totalDistributed: totalAmount,
      results,
    });
  } catch (error) {
    console.error('Dividend error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});