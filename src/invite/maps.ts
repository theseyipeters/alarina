/** Google Maps search for a venue; opens the Maps app on phones. */
export const mapLink = (...parts: (string | null)[]) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.filter(Boolean).join(', '))}`
