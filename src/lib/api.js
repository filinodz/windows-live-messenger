// Client de l'API MySQL/Laravel du messager (remplace Supabase).
// La base est configurable au runtime via window.__WLM_API (défini dans index.html),
// ce qui permet le même build en local (/api/wlm) et en prod (/vn/api/wlm).

const API_BASE = ((typeof window !== 'undefined' && window.__WLM_API) || '/api/wlm').replace(/\/+$/, '');
const TOKEN_KEY = 'wlm_token';

export const getToken = () => (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null) || null;
export const setToken = (t) => {
  if (typeof localStorage === 'undefined') return;
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
};

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (e) { /* réponse vide */ }

  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || ('HTTP ' + res.status));
    err.status = res.status;
    err.code = res.status;
    err.data = data;
    throw err;
  }
  return data || {};
}

export const api = {
  register: (email, password, display_name, status) =>
    request('POST', '/register', { email, password, display_name, status }),
  login: (email, password, status) => request('POST', '/login', { email, password, status }),
  logout: () => request('POST', '/logout'),
  me: () => request('GET', '/me'),
  updateProfile: (changes) => request('PUT', '/profile', changes),
  contacts: () => request('GET', '/contacts'),
  pending: () => request('GET', '/pending'),
  invite: (email) => request('POST', '/invite', { email }),
  answer: (friendshipId, accept) => request('POST', '/friendship/' + friendshipId + '/answer', { accept }),
  contact: (id) => request('GET', '/profile/' + id),
  messages: (contactId, since = 0) => request('GET', '/messages/' + contactId + (since ? ('?since=' + since) : '')),
  send: (recipient_id, content, kind = 'text') => request('POST', '/messages', { recipient_id, content, kind }),
};
