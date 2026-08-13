// Where the collapsed Deal Maker launcher sits on the store page.
export const DEAL_MAKER_POSITIONS = [
  { key: "bottom_left", label: "Bottom Left", className: "bottom-24 left-6 md:left-10", top: false },
  { key: "bottom_center", label: "Bottom Center", className: "bottom-24 left-1/2 -translate-x-1/2", top: false },
  { key: "bottom_right", label: "Bottom Right", className: "bottom-24 right-6 md:right-10", top: false },
  { key: "top_left", label: "Top Left", className: "top-24 left-6 md:left-10", top: true },
  { key: "top_right", label: "Top Right", className: "top-24 right-6 md:right-10", top: true },
];

export const DEFAULT_DEAL_MAKER_POSITION = "bottom_left";

export function getDealMakerPosition(key) {
  return DEAL_MAKER_POSITIONS.find((p) => p.key === key) || DEAL_MAKER_POSITIONS[0];
}