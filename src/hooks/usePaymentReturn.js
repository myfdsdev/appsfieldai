import { useEffect } from "react";
import { toast } from "sonner";
import { capturePaypalOrder, confirmStripeOrder } from "@/lib/storeCustomerAuth";

// Handles the buyer returning from PayPal (?paypal=<orderId>) or Stripe (?stripe=<orderId>)
// on any store page: confirms the payment, then calls onSuccess.
export function usePaymentReturn(marketplaceId, onSuccess) {
  useEffect(() => {
    if (!marketplaceId) return;
    const params = new URLSearchParams(window.location.search);
    const clean = () => window.history.replaceState({}, "", window.location.pathname);

    if (params.get("paypal_cancel")) { toast.error("PayPal payment was cancelled."); clean(); return; }
    if (params.get("stripe_cancel")) { toast.error("Card payment was cancelled."); clean(); return; }

    const paypalOrderId = params.get("paypal");
    const stripeOrderId = params.get("stripe");
    if (!paypalOrderId && !stripeOrderId) return;
    // Clean the URL so a refresh doesn't re-trigger.
    clean();

    const confirm = paypalOrderId
      ? capturePaypalOrder({ marketplaceId, paypalOrderId })
      : confirmStripeOrder({ marketplaceId, orderId: stripeOrderId });
    confirm
      .then(() => {
        toast.success("Payment successful! Your order is confirmed.");
        onSuccess?.();
      })
      .catch((e) => toast.error(e.message || (paypalOrderId ? "We couldn't confirm your PayPal payment." : "We couldn't confirm your card payment.")));
  }, [marketplaceId]); // eslint-disable-line
}