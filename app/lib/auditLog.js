// Client-side helper — fire-and-forget audit log call.
// Failures are silently swallowed so they never break the UI action.
export async function logAudit(action, entity, entityId = null, details = {}) {
  try {
    await fetch('/api/admin/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entity, entity_id: entityId, details }),
    })
  } catch { /* non-fatal */ }
}
