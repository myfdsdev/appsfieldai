// Every notification event the platform can fire, grouped for the admin control panel.
export const NOTIFICATION_EVENT_GROUPS = [
  {
    label: "Deals & Requests",
    events: [
      { key: "reserve_submitted", label: "Spot reservation submitted" },
      { key: "acquisition_submitted", label: "Acquisition request submitted" },
      { key: "request_approved", label: "Request approved" },
      { key: "request_rejected", label: "Request rejected" },
      { key: "request_contacted", label: "Buyer contacted" },
      { key: "request_in_progress", label: "Deal in progress" },
      { key: "deal_closed", label: "Deal closed" },
      { key: "request_cancelled", label: "Request cancelled" },
      { key: "listing_submitted", label: "New listing submitted" },
    ],
  },
  {
    label: "Auctions & Investments",
    events: [
      { key: "outbid", label: "Outbid on an auction" },
      { key: "dividend", label: "Dividend payout" },
      { key: "share_purchased", label: "Share purchased" },
      { key: "ownership_sold", label: "Ownership sold" },
    ],
  },
  {
    label: "Store & Products",
    events: [
      { key: "product_access_request", label: "Product access requested" },
    ],
  },
  {
    label: "Affiliates",
    events: [
      { key: "affiliate_application", label: "Affiliate application" },
      { key: "affiliate_approved", label: "Affiliate approved" },
      { key: "affiliate_rejected", label: "Affiliate rejected" },
      { key: "affiliate_message", label: "Affiliate message" },
      { key: "affiliate_commission", label: "Affiliate commission earned" },
    ],
  },
];

export const NOTIFICATION_SETTINGS_DEFAULTS = {
  masterInApp: true,
  masterEmail: true,
  events: {},
};