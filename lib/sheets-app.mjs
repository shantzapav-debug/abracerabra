/**
 * Server-side calls to the Apps Script web app.
 * Google answers the first POST with a redirect and drops the body if the
 * client follows it as GET, so the POST is sent again to the redirect target.
 */

function config() {
  const url = String(process.env.SHEETS_APP_URL || "").trim();
  const secret = String(process.env.APP_SHARED_SECRET || "").trim();
  if (!url || !secret) {
    const error = new Error("Sheets app is not configured");
    error.code = "UNCONFIGURED";
    throw error;
  }
  return { url, secret };
}

async function postSheetsApp(payload) {
  const { url, secret } = config();
  const body = JSON.stringify({ ...payload, app_shared_secret: secret });
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-App-Secret": secret,
  };
  const first = await fetch(url, { method: "POST", headers, body, redirect: "manual" });
  let response = first;
  if ([301, 302, 303, 307, 308].includes(first.status)) {
    const location = first.headers.get("location");
    if (!location) throw new Error("Sheets app redirect is missing a location");
    response = await fetch(new URL(location, url), {
      method: "POST",
      headers,
      body,
      redirect: "follow",
    });
  }
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Sheets app returned a non-JSON response");
  }
  if (!data || data.ok === false) {
    const error = new Error(data?.error || "Sheets app rejected the request");
    error.status = 502;
    throw error;
  }
  return data;
}

export async function fetchLeadSummary(leadId) {
  return postSheetsApp({ action: "lead", lead_id: leadId });
}

export async function postLogistics(payload) {
  return postSheetsApp({ action: "logistics", ...payload });
}
