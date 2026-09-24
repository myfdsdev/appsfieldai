// Builds the StoreOrder update for an order whose online payment (PayPal / Stripe /
// Razorpay) was just confirmed as successful. The order is auto-approved & delivered
// (status "completed", access granted) when every product in it is marked
// "Eligible for auto-approved access & delivery" and delivery info exists.
// The product flag is read live at payment time, so it applies even to orders
// placed before the owner ticked the box. Otherwise the order stays "processing"
// for the owner to deliver manually.
export async function paidOrderUpdate(base44: any, order: any, extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const items = Array.isArray(order?.items) ? order.items : [];

  let eligible = items.length > 0;
  let delivery = order?.delivery || {};
  for (const it of items) {
    const listing = (await base44.asServiceRole.entities.SaaSListing.filter({ id: it.listingId }))[0];
    if (!listing?.autoDelivery) { eligible = false; break; }
    if (!delivery.accessUrl && !delivery.instructions && (listing.delivery?.accessUrl || listing.delivery?.instructions)) {
      delivery = { accessUrl: listing.delivery.accessUrl || '', instructions: listing.delivery.instructions || '' };
    }
  }
  const hasDelivery = !!(delivery.accessUrl || delivery.instructions);

  return {
    paymentStatus: 'paid',
    paidAt: now,
    ...(eligible && hasDelivery
      ? { status: 'completed', accessStatus: 'granted', autoDeliver: true, delivery: { ...delivery, deliveredAt: now } }
      : { status: 'processing' }),
    ...extra,
  };
}