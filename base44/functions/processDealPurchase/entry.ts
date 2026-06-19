import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId, spots = 1, purchaseType = "spot" } = await req.json();

    if (!listingId) {
      return Response.json({ error: 'listingId is required' }, { status: 400 });
    }

    // Fetch listing
    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = listings[0];

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Validate deal is active
    if (listing.status !== 'active' && listing.status !== 'approved') {
      return Response.json({ error: 'This deal is not currently active' }, { status: 400 });
    }

    // Check if deal has expired (time-based)
    if (!listing.noDayLimit && listing.dealEndDate) {
      const endDate = new Date(listing.dealEndDate);
      if (endDate < new Date()) {
        // Mark as expired
        await base44.asServiceRole.entities.SaaSListing.update(listingId, { dealStatus: 'expired' });
        return Response.json({ error: 'This deal has expired' }, { status: 400 });
      }
    }

    const soldShares = listing.soldShares || 0;
    const totalShares = listing.totalShares || 0;
    const spotsLeft = totalShares - soldShares;

    // For single purchase, check if deal type allows it
    if (purchaseType === "full") {
      if (listing.dealType === "group_deal") {
        return Response.json({ error: 'This deal only allows group spot purchases' }, { status: 400 });
      }
    }

    // For spot purchase, validate spots available
    if (purchaseType === "spot") {
      if (spots > spotsLeft) {
        return Response.json({ error: `Only ${spotsLeft} spots remaining` }, { status: 400 });
      }
      if (spots < 1) {
        return Response.json({ error: 'Must purchase at least 1 spot' }, { status: 400 });
      }
    }

    const totalAmount = purchaseType === "full"
      ? listing.price
      : (listing.sharePrice || 0) * spots;

    // Create purchase record
    const purchase = await base44.asServiceRole.entities.SharePurchase.create({
      userId: user.id,
      userName: user.full_name || 'Anonymous',
      listingId,
      listingTitle: listing.softwareName,
      sharesBought: purchaseType === "full" ? totalShares : spots,
      totalAmount,
      purchaseType,
    });

    // Update listing sold shares
    const newSoldShares = purchaseType === "full"
      ? totalShares
      : soldShares + spots;

    const updateData = { soldShares: newSoldShares };

    // Check if fully funded
    if (newSoldShares >= totalShares) {
      updateData.dealStatus = 'funded';
      updateData.status = 'sold';
      console.log(`Deal ${listingId} fully funded! All ${totalShares} spots filled.`);
    }

    await base44.asServiceRole.entities.SaaSListing.update(listingId, updateData);

    // Create notification for the deal owner
    try {
      await base44.asServiceRole.entities.Notification.create({
        userId: listing.ownerId,
        type: 'share_purchased',
        title: purchaseType === "full" ? 'Full Purchase!' : 'New Spot Reserved!',
        message: `${user.full_name || 'Someone'} ${purchaseType === "full" ? "bought the full deal" : `reserved ${spots} spot(s)`} on ${listing.softwareName} for $${totalAmount.toLocaleString()}`,
        listingId,
      });
    } catch (e) {
      console.error('Failed to create notification:', e.message);
    }

    // If fully funded, notify all spot holders
    if (newSoldShares >= totalShares) {
      try {
        const allPurchases = await base44.asServiceRole.entities.SharePurchase.filter({ listingId });
        const uniqueUserIds = [...new Set(allPurchases.map(p => p.userId))];
        for (const uid of uniqueUserIds) {
          await base44.asServiceRole.entities.Notification.create({
            userId: uid,
            type: 'share_purchased',
            title: 'Deal Fully Funded! 🎉',
            message: `Great news! The deal for ${listing.softwareName} has been fully funded. All ${totalShares} spots are filled!`,
            listingId,
          });
        }
      } catch (e) {
        console.error('Failed to notify spot holders:', e.message);
      }
    }

    return Response.json({
      success: true,
      purchase: { id: purchase.id, amount: totalAmount, spots: purchaseType === "full" ? totalShares : spots },
      dealProgress: { soldShares: newSoldShares, totalShares, isFunded: newSoldShares >= totalShares },
    });

  } catch (error) {
    console.error('processDealPurchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});