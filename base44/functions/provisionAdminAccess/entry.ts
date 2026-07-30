import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// On-demand provisioning: fired when a store owner clicks "Get Admin Access" on an
// imported DFY product that has a provisioning endpoint URL configured.
// Sends the owner's name + email to that product's custom endpoint, signed with the
// universal PLATFORM_WEBHOOK_SECRET (X-Platform-Secret header). The external app
// verifies the same shared secret for every endpoint.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId } = await req.json();
    if (!listingId) return Response.json({ error: 'Missing listingId' }, { status: 400 });

    // Load the imported listing and confirm the owner owns the store it belongs to.
    const listing = await base44.asServiceRole.entities.SaaSListing.get(listingId);
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

    const markets = await base44.asServiceRole.entities.Marketplace.filter({ ownerId: user.id });
    const ownsStore = markets.some((m) => m.id === listing.marketplaceId);
    if (!ownsStore) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const endpointUrl = (listing.adminAccess?.provisionEndpointUrl || '').trim();
    if (!endpointUrl) {
      // No endpoint configured — nothing to provision, that's fine.
      return Response.json({ ok: true, skipped: true });
    }

    const secret = secrets.get('PLATFORM_WEBHOOK_SECRET') || '';
    if (!secret) {
      console.error('provisionAdminAccess: PLATFORM_WEBHOOK_SECRET is not set');
      return Response.json({ error: 'Provisioning not configured' }, { status: 500 });
    }

    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Secret': secret,
        },
        body: JSON.stringify({
          ownerEmail: user.email,
          ownerName: user.full_name || '',
          email: user.email,
          name: user.full_name || '',
          product: listing.softwareName || '',
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`provisionAdminAccess failed (${res.status}): ${text}`);
        return Response.json({ error: 'Provisioning endpoint returned an error', status: res.status }, { status: 502 });
      }
      return Response.json({ ok: true });
    } catch (e) {
      console.error('provisionAdminAccess fetch error:', e.message);
      return Response.json({ error: e.message }, { status: 502 });
    }
  } catch (error) {
    console.error('provisionAdminAccess error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}