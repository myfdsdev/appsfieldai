// Builds the StoreOrder update for an order whose online payment (PayPal / Stripe /
// Razorpay) was just confirmed. If the order already carries delivery info from the
// product (access URL or instructions), it is auto-delivered: status "completed" and
// access granted, so the buyer gets instant access with no manual approval.
// Orders without delivery info stay "processing" for the owner to deliver manually.
export function paidOrderUpdate(order: any, extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const d = order?.delivery || {};
  const hasDelivery = !!(d.accessUrl || d.instructions);
  return {
    paymentStatus: 'paid',
    paidAt: now,
    ...(hasDelivery
      ? { status: 'completed', accessStatus: 'granted', delivery: { ...d, deliveredAt: now } }
      : { status: 'processing' }),
    ...extra,
  };
}