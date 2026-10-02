// Adaptateur « supabase » adossé à l'API MySQL/Laravel. Il expose exactement la
// surface utilisée par l'app (auth.*, from('profiles'), channel/removeChannel),
// de sorte que le reste du code (AuthContext, LoginPage, pages) reste inchangé.
import { api, getToken, setToken } from './api';

export const isOnlineMode = true;

let currentSession = null;
const listeners = new Set();

const cacheUser = (user) => {
  if (typeof localStorage === 'undefined' || !user) return;
  localStorage.setItem('wlm_uid', String(user.id));
  localStorage.setItem('wlm_email', user.email || '');
};

const readCachedSession = () => {
  if (typeof localStorage === 'undefined') return null;
  const id = Number(localStorage.getItem('wlm_uid'));
  if (!id) return null;
  return { user: { id, email: localStorage.getItem('wlm_email') || '' } };
};

const sessionFromProfile = (profile) => ({ user: { id: profile.id, email: profile.email } });

const emit = (event, session) => {
  currentSession = session;
  if (session?.user) cacheUser(session.user);
  listeners.forEach((cb) => { try { cb(event, session); } catch (e) { /* ignore */ } });
};

const auth = {
  async signUp({ email, password, options }) {
    try {
      const meta = (options && options.data) || {};
      const r = await api.register(email, password, meta.display_name, meta.status);
      setToken(r.token);
      const session = sessionFromProfile(r.profile);
      emit('SIGNED_IN', session);
      return { data: { session, user: session.user }, error: null };
    } catch (e) {
      return { data: { session: null, user: null }, error: { message: e.message } };
    }
  },
  async signInWithPassword({ email, password }) {
    try {
      const r = await api.login(email, password);
      setToken(r.token);
      const session = sessionFromProfile(r.profile);
      emit('SIGNED_IN', session);
      return { data: { session, user: session.user }, error: null };
    } catch (e) {
      return { data: { session: null, user: null }, error: { message: e.message } };
    }
  },
  async getSession() {
    if (!currentSession && getToken()) currentSession = readCachedSession();
    return { data: { session: currentSession } };
  },
  onAuthStateChange(callback) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
  async signOut() {
    try { await api.logout(); } catch (e) { /* ignore */ }
    setToken(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('wlm_uid');
      localStorage.removeItem('wlm_email');
    }
    emit('SIGNED_OUT', null);
    return { error: null };
  },
};

// Requête minimale sur « profiles » : ne concerne QUE l'utilisateur courant
// (chargement de son profil, mises à jour, statut). Chaînable et « awaitable ».
const profilesQuery = () => {
  const state = { changes: null };
  const run = async () => {
    try {
      if (state.changes) {
        const r = await api.updateProfile(state.changes);
        return { data: r.profile, error: null };
      }
      const r = await api.me();
      return { data: r.profile, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code } };
    }
  };
  const builder = {
    select() { return builder; },
    update(changes) { state.changes = changes; return builder; },
    eq() { return builder; },
    ilike() { return builder; },
    single() { return run(); },
    maybeSingle() { return run(); },
    then(resolve, reject) { return run().then(resolve, reject); },
  };
  return builder;
};

const noopChannel = () => {
  const ch = { on() { return ch; }, subscribe() { return ch; }, send() {}, unsubscribe() {} };
  return ch;
};

export const supabase = {
  auth,
  from() { return profilesQuery(); },
  channel() { return noopChannel(); },
  removeChannel(ch) { if (ch && typeof ch.unsubscribe === 'function') ch.unsubscribe(); },
};
