import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active listings
    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ status: 'active' });
    const now = new Date();
    let expiredCount = 0;

    for (const listing of listings) {
      // Skip listings with no time limit
      if (listing.noDayLimit) continue;

      // Check if deal has expired
      if (listing.dealEndDate && new Date(listing.dealEndDate) < now) {
        // Only expire if not fully funded
        if ((listing.soldShares || 0) < (listing.totalShares || 0)) {
          await base44.asServiceRole.entities.SaaSListing.update(listing.id, {
            dealStatus: 'expired',
          });
          expiredCount++;
          console.log(`Deal expired: ${listing.softwareName} (${listing.id})`);

          // Notify the owner
          try {
            await base44.asServiceRole.entities.Notification.create({
              userId: listing.ownerId,
              type: 'deal_closed',
              title: 'Deal Expired',
              message: `Your deal "${listing.softwareName}" has expired. ${listing.soldShares || 0}/${listing.totalShares} spots were filled.`,
              listingId: listing.id,
            });
          } catch (e) {
            console.error('Failed to notify owner:', e.message);
          }
        }
      }
    }

    return Response.json({ success: true, expiredCount, totalChecked: listings.length });
  } catch (error) {
    console.error('checkExpiredDeals error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});