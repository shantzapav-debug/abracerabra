/**
 * Logistics API — try FastAPI POST /api/logistics, fall back to localStorage mock.
 */
import { apiFetch } from './client';

const LOGISTICS_LOG_KEY = 'abracerabra_logistics_submissions';

function loadSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(LOGISTICS_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSubmissions(list) {
  localStorage.setItem(LOGISTICS_LOG_KEY, JSON.stringify(list));
}

function mockSubmit(payload) {
  const submission = {
    lead_id: payload.lead_id,
    address: payload.address,
    landmark: payload.landmark || '',
    location: payload.location || '',
    mode_of_transport: payload.mode_of_transport,
    submittedAt: new Date().toISOString(),
    offline: true,
  };
  const log = loadSubmissions();
  log.push(submission);
  saveSubmissions(log);
  console.log('[Abracerabra Logistics] Mock submission:', submission);
  return {
    success: true,
    lead_id: payload.lead_id,
    updated_lead: false,
    offline: true,
  };
}

/**
 * @param {{ lead_id: string, address: string, landmark?: string, location?: string, mode_of_transport: string }} payload
 * @returns {Promise<{ success: boolean, lead_id: string, updated_lead?: boolean, offline?: boolean }>}
 */
export async function submitLogistics(payload) {
  const body = {
    lead_id: String(payload.lead_id || '').trim(),
    address: String(payload.address || '').trim(),
    landmark: String(payload.landmark || '').trim(),
    location: String(payload.location || '').trim(),
    mode_of_transport: String(payload.mode_of_transport || '').trim(),
  };

  try {
    const result = await apiFetch('/api/logistics', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      success: result.success,
      lead_id: result.lead_id,
      updated_lead: result.updated_lead,
    };
  } catch (err) {
    console.warn('[Abracerabra] logistics API unreachable, using local mock', err);
    return mockSubmit(body);
  }
}

export async function listLogistics() {
  return Promise.resolve(loadSubmissions());
}
