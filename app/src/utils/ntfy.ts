export function sendSessionExpiredAlert() {
  try {
    const payload = {
      topic: 'clausync-admin-alerts9930',
      title: '⚠️ ClauSync Session Expired',
      message: 'A client\'s Telegram session has died and needs re-authentication.',
      priority: 5,
      tags: ['warning']
    };
    fetch('https://ntfy.sh/', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {});
  } catch {
    // silent
  }
}
