// Loads the Razorpay Checkout script once and opens the hosted payment popup.
// Resolves with the payment response on success, rejects if the buyer dismisses it.

let scriptPromise = null;

function loadRazorpayScript() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Could not load Razorpay. Check your connection and try again.")); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

// order = the response from createRazorpayOrder (keyId, razorpayOrderId, amount, currency, storeName, customer*)
// brandColor = store accent for the popup theme.
export async function openRazorpayCheckout({ order, brandColor = "#f97316" }) {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: order.storeName,
      description: "Order payment",
      prefill: {
        name: order.customerName || "",
        email: order.customerEmail || "",
        contact: order.customerPhone || "",
      },
      theme: { color: brandColor },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });
    rzp.on("payment.failed", (resp) => reject(new Error(resp?.error?.description || "Payment failed. Please try again.")));
    rzp.open();
  });
}