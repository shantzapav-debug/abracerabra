import { verifyLeadToken } from "./logistics-token.mjs";
import { fetchLeadSummary, postLogistics } from "./sheets-app.mjs";

const MODES = new Set(["Road", "Rail", "Air", "Sea", "Courier", "Customer pickup"]);

function linkSecret() {
  return String(process.env.LOGISTICS_LINK_SECRET || "");
}

function clean(value) {
  return String(value ?? "").trim();
}

export async function verifyLogisticsLink({ lead, token }) {
  const leadId = clean(lead);
  if (!verifyLeadToken(leadId, token, linkSecret())) {
    return { valid: false };
  }
  let ref = "";
  let name = "";
  try {
    const summary = await fetchLeadSummary(leadId);
    ref = clean(summary?.ref);
    name = clean(summary?.name);
  } catch (error) {
    console.error(`Lead lookup skipped: ${error.message}`);
  }
  return { valid: true, lead_id: leadId, ref, name };
}

export async function submitLogistics(body) {
  const source = body && typeof body === "object" ? body : {};
  const leadId = clean(source.lead_id || source.lead);
  const token = clean(source.token || source.t);
  if (!verifyLeadToken(leadId, token, linkSecret())) {
    const error = new Error("Invalid or expired link");
    error.status = 403;
    throw error;
  }

  const payload = {
    lead_id: leadId,
    token,
    address: clean(source.address),
    landmark: clean(source.landmark),
    location: clean(source.location),
    country: clean(source.country),
    mode_of_transport: clean(source.mode_of_transport),
    preferred_delivery_date: clean(source.preferred_delivery_date),
    contact_person: clean(source.contact_person),
    contact_phone: clean(source.contact_phone),
    notes: clean(source.notes),
  };

  if (!payload.address || !payload.mode_of_transport) {
    const error = new Error("Address and mode of transport are required");
    error.status = 400;
    throw error;
  }
  if (!MODES.has(payload.mode_of_transport)) {
    const error = new Error("Unknown mode of transport");
    error.status = 400;
    throw error;
  }

  const result = await postLogistics(payload);
  return {
    success: true,
    lead_id: leadId,
    updated: Boolean(result.updated),
    created: Boolean(result.created),
  };
}
