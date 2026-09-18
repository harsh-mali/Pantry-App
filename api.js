// ---------------------------------------------------------------
// Talks to your Google Apps Script Web App backend.
//
// Every call that carries your PIN goes through POST now, with the
// PIN in the request body — never in the URL, so it can't end up in
// browser history, address bars, or server logs. Only the harmless
// "ping" check still uses GET.
//
// POST requests use Content-Type "text/plain" on purpose — this
// keeps them "simple requests" so the browser doesn't send a CORS
// preflight (OPTIONS) that Apps Script can't answer. Your doPost()
// already does JSON.parse on the raw body, so nothing about the
// request format needs to change on the backend for this to work.
// ---------------------------------------------------------------

const BASE_URL = window.PANTRY_CONFIG.APPS_SCRIPT_URL;

async function apiGet(params){
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'GET' });
  if(!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

async function apiPost(action, payload){
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload })
  });
  if(!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

window.PantryApi = {
  ping: () => apiGet({ api: 'ping' }),
  verifyPin: (pin) => apiPost('verifyPin', { pin }),
  getStock: (month, pin) => apiPost('getStock', { month, pin }),
  getEntries: (month, pin) => apiPost('getEntries', { month, pin }),
  getExportUrl: (month, pin) => apiPost('getExport', { month, pin }),
  saveDailyEntry: (entry, pin) => apiPost('saveDailyEntry', { entry, pin }),
  saveBulkStock: (monthYearStr, stockMap, pin) => apiPost('saveBulkStock', { monthYearStr, stockMap, pin })
};