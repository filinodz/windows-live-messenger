import { isOnlineMode } from '../lib/supabase';
import { api } from '../lib/api';
import { assetUrl } from '../utils/assets';

const isRecentlyActive = (lastSeen) => lastSeen && Date.now() - new Date(lastSeen).getTime() < 90000;

export const normalizeContact = (profile, friendship = {}) => ({
  id: profile.id,
  name: profile.display_name || profile.email,
  email: profile.email,
  image: assetUrl(profile.avatar_url || '/assets/usertiles/default.png'),
  message: profile.personal_message || '',
  status: profile.status === 'Offline' || !isRecentlyActive(profile.last_seen)
    ? 'offline'
    : profile.status?.toLowerCase() === 'available' ? 'online' : profile.status?.toLowerCase() || 'offline',
  isFavorite: friendship.is_favorite ? 1 : 0,
});

export const getContacts = async () => {
  if (!isOnlineMode) return null;
  const { contacts } = await api.contacts();
  return (contacts || []).map((row) => normalizeContact(row.contact, { is_favorite: row.is_favorite }));
};

export const getPendingInvitations = async () => {
  if (!isOnlineMode) return [];
  const { invitations } = await api.pending();
  return invitations || [];
};

export const inviteContact = async (email) => {
  const { target } = await api.invite(email.trim());
  return target;
};

export const answerInvitation = async (friendshipId, accept) => {
  await api.answer(friendshipId, accept);
};

export const getContact = async (id) => {
  if (!isOnlineMode) return null;
  const { contact } = await api.contact(id);
  return normalizeContact(contact);
};

const withRole = (message, userId) => ({ ...message, role: message.sender_id === userId ? 'user' : 'assistant' });

export const getMessages = async (userId, contactId) => {
  const { messages } = await api.messages(contactId);
  return (messages || []).map((m) => withRole(m, userId));
};

export const sendMessage = async ({ recipientId, content, kind = 'text' }) => {
  const { message } = await api.send(recipientId, content, kind);
  return message;
};

// Temps réel par polling (remplace les canaux Supabase). Le premier passage
// utilise since=0 : tous les messages sont renvoyés et dédupliqués côté page
// (appendUnique), puis on ne récupère que les nouveaux via l'id.
export const subscribeToMessages = (userId, contactId, onMessage) => {
  let lastId = 0;
  let stopped = false;
  const poll = async () => {
    if (stopped) return;
    try {
      const { messages } = await api.messages(contactId, lastId);
      (messages || []).forEach((m) => {
        if (m.id > lastId) lastId = m.id;
        onMessage(withRole(m, userId));
      });
    } catch (e) { /* réseau : on réessaiera au prochain tick */ }
  };
  poll();
  const timer = setInterval(poll, 2500);
  return { unsubscribe: () => { stopped = true; clearInterval(timer); } };
};

// Indicateur « en train d'écrire » : non pris en charge en mode polling.
// On renvoie un canal inerte pour préserver l'interface appelante.
export const createTypingChannel = () => ({ send() {}, unsubscribe() {} });
