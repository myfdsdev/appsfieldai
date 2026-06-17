/**
 * Builds a CSS style object for the hero background from AppConfig settings.
 * Falls back to the default dark radial gradient if no config is provided.
 */
export function buildHeroBackground(config = {}) {
  const opacity = (config.hero_bg_opacity ?? 100) / 100;

  if (config.hero_bg_type === "solid") {
    const color = config.hero_bg_solid_color || "#0a0603";
    return { background: color, opacity };
  }

  if (config.hero_bg_type === "image" && config.hero_bg_image_url) {
    return {
      backgroundImage: `url(${config.hero_bg_image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      opacity,
    };
  }

  // Gradient (default)
  const start = config.hero_gradient_start || "#b43c0a";
  const middle = config.hero_gradient_middle || "#7c2a06";
  const end = config.hero_gradient_end || "#0a0603";
  const intensity = (config.hero_gradient_intensity ?? 35) / 100;
  const direction = config.hero_gradient_direction || "radial";

  // Convert hex to rgba with intensity-based alpha
  const toRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  let gradient;
  if (direction === "radial") {
    gradient = `radial-gradient(ellipse at 50% 60%, ${toRgba(start, intensity)} 0%, ${toRgba(middle, intensity * 0.6)} 40%, ${toRgba(end, 0)} 70%)`;
  } else if (direction === "to bottom") {
    gradient = `linear-gradient(to bottom, ${toRgba(start, intensity)}, ${toRgba(middle, intensity * 0.7)}, ${toRgba(end, intensity * 0.2)})`;
  } else if (direction === "to right") {
    gradient = `linear-gradient(to right, ${toRgba(start, intensity)}, ${toRgba(middle, intensity * 0.7)}, ${toRgba(end, intensity * 0.2)})`;
  } else if (direction === "diagonal") {
    gradient = `linear-gradient(135deg, ${toRgba(start, intensity)}, ${toRgba(middle, intensity * 0.7)}, ${toRgba(end, intensity * 0.2)})`;
  } else {
    gradient = `radial-gradient(ellipse at 50% 60%, ${toRgba(start, intensity)} 0%, ${toRgba(end, 0)} 70%)`;
  }

  return { background: gradient };
}