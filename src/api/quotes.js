/**
 * Quote API — try FastAPI POST /api/quote, fall back to localStorage mock.
 */
import { apiFetch } from './client';

const RFQ_LOG_KEY = 'abracerabra_rfq_submissions';

function loadSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(RFQ_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSubmissions(list) {
  localStorage.setItem(RFQ_LOG_KEY, JSON.stringify(list));
}

function mockSubmit(payload) {
  const leadId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'mock-' + Date.now().toString(36);
  const submission = {
    ref: 'RFQ-' + Date.now().toString(36).toUpperCase(),
    lead_id: leadId,
    submittedAt: new Date().toISOString(),
    contact: payload.contact,
    items: payload.items,
    totals: payload.totals,
    disclaimer: 'Indicative pricing — non-binding. No online payment.',
  };
  const log = loadSubmissions();
  log.push(submission);
  saveSubmissions(log);
  console.log('[Abracerabra RFQ] Mock submission:', submission);
  return {
    ref: submission.ref,
    submittedAt: submission.submittedAt,
    lead_id: submission.lead_id,
    success: true,
    offline: true,
  };
}

/**
 * @param {{ contact: object, items: array, totals?: object }} payload
 * @returns {Promise<{ ref: string, submittedAt?: string, lead_id?: string, success?: boolean }>}
 */
export async function submitQuote(payload) {
  const contact = payload.contact || {};
  const items = payload.items || [];
  const body = {
    name: contact.name,
    country: contact.country,
    state: contact.state,
    city: contact.city,
    email: contact.email,
    mobile: contact.mobile,
    cart: items.map((i) => ({
      product_id: i.productId || i.product_id || i.id,
      qty: i.qty,
    })),
  };

  try {
    const result = await apiFetch('/api/quote', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      success: result.success,
      lead_id: result.lead_id,
      ref: result.ref,
      submittedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[Abracerabra] quote API unreachable, using local mock', err);
    return mockSubmit(payload);
  }
}


export async function listQuotes() {
  return Promise.resolve(loadSubmissions());
}
