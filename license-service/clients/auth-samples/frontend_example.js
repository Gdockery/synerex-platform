/**
 * Synerex frontend example flow (browser)
 *
 * 1) User provides signed license JSON (from Synerex issuance)
 * 2) Frontend calls backend /session with X-License header
 * 3) Backend returns a short-lived JWT token
 * 4) Frontend uses token for subsequent API calls
 */

export async function createSessionFromLicense(backendBaseUrl, signedLicenseJsonString) {
  const resp = await fetch(`${backendBaseUrl}/session`, {
    method: "POST",
    headers: {
      "X-License": signedLicenseJsonString
    }
  });
  if (!resp.ok) throw new Error(`session_failed:${resp.status}`);
  const data = await resp.json();
  localStorage.setItem("synerex_token", data.token);
  return data;
}

export async function apiCall(backendBaseUrl, path) {
  const token = localStorage.getItem("synerex_token");
  const resp = await fetch(`${backendBaseUrl}${path}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!resp.ok) throw new Error(`api_failed:${resp.status}`);
  return await resp.json();
}
