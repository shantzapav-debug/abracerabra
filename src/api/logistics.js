/**
 * Private logistics link. The form is shown only after /api/logistics-verify
 * accepts the lead id and token. Submit posts to /api/logistics.
 */
import { apiFetch } from './client';

export async function verifyLogisticsLink(lead, token) {
  const params = new URLSearchParams({
    lead: String(lead || ''),
    t: String(token || ''),
  });
  return apiFetch(`/api/logistics-verify?${params.toString()}`);
}

/**
 * @param {{
 *   lead_id: string,
 *   token: string,
 *   address: string,
 *   landmark?: string,
 *   location?: string,
 *   country?: string,
 *   mode_of_transport: string,
 *   preferred_delivery_date?: string,
 *   contact_person?: string,
 *   contact_phone?: string,
 *   notes?: string,
 * }} payload
 */
export async function submitLogistics(payload) {
  return apiFetch('/api/logistics', {
    method: 'POST',
    body: JSON.stringify({
      lead_id: String(payload.lead_id || '').trim(),
      token: String(payload.token || '').trim(),
      address: String(payload.address || '').trim(),
      landmark: String(payload.landmark || '').trim(),
      location: String(payload.location || '').trim(),
      country: String(payload.country || '').trim(),
      mode_of_transport: String(payload.mode_of_transport || '').trim(),
      preferred_delivery_date: String(payload.preferred_delivery_date || '').trim(),
      contact_person: String(payload.contact_person || '').trim(),
      contact_phone: String(payload.contact_phone || '').trim(),
      notes: String(payload.notes || '').trim(),
    }),
  });
}
