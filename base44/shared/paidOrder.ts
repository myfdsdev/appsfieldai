// Builds the StoreOrder update for an order whose online payment (PayPal / Stripe /
// Razorpay) was just confirmed. The order is auto-approved & delivered (status
// "completed", access granted) only when the owner marked every product in it as
// eligible for auto delivery AND delivery info (access URL or instructions) exists.
// Otherwise it stays "processing" for the owner to deliver manually.
export function paidOrderUpdate(order: any, extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const d = order?.delivery || {};
  const hasDelivery = !!(d.accessUrl || d.instructions);
  const autoDeliver = order?.autoDeliver === true && hasDelivery;
  return {
    paymentStatus: 'paid',
    paidAt: now,
    ...(autoDeliver
      ? { status: 'completed', accessStatus: 'granted', delivery: { ...d, deliveredAt: now } }
      : { status: 'processing' }),
    ...extra,
  };
}