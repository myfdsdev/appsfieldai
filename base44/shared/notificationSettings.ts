// Shared reader for the admin-managed notification control settings.
// Stored on AppConfig(key: "notification_settings") as:
//   { masterInApp, masterEmail, events: { <eventKey>: { inApp, email } } }

export async function getNotificationSettings(base44) {
  const rows = await base44.asServiceRole.entities.AppConfig.filter({ key: "notification_settings" });
  return rows[0]?.notificationSettings || {};
}

// channel: "inApp" | "email". Defaults to enabled when nothing is configured.
export function isChannelEnabled(settings, eventKey, channel) {
  const master = channel === "email" ? settings.masterEmail : settings.masterInApp;
  if (master === false) return false;
  if (!eventKey) return true;
  const ev = settings.events?.[eventKey];
  if (!ev) return true;
  return ev[channel] !== false;
}