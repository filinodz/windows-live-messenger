import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isOnlineMode, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const cacheProfile = (profile, email) => {
  if (!profile) return;
  localStorage.setItem('loggedin', 'true');
  localStorage.setItem('email', email || profile.email || '');
  localStorage.setItem('name', profile.display_name || '');
  localStorage.setItem('message', profile.personal_message || '');
  localStorage.setItem('status', profile.status || 'Available');
  if (profile.avatar_url) localStorage.setItem('picture', profile.avatar_url);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isOnlineMode);

  const loadProfile = async (activeSession) => {
    if (!activeSession || !supabase) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', activeSession.user.id).single();
    if (!error && data) {
      setProfile(data);
      cacheProfile(data, activeSession.user.email);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      return loadProfile(data.session);
    }).finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession).finally(() => setLoading(false));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) return undefined;
    const markActive = () => supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', session.user.id);
    markActive();
    const heartbeat = setInterval(markActive, 45000);
    return () => clearInterval(heartbeat);
  }, [session]);

  const refreshProfile = async () => loadProfile(session);

  const updateProfile = async (changes) => {
    if (!session || !supabase) {
      Object.entries(changes).forEach(([key, value]) => {
        const localKey = { display_name: 'name', personal_message: 'message', avatar_url: 'picture' }[key] || key;
        localStorage.setItem(localKey, value ?? '');
      });
      setProfile((current) => ({ ...current, ...changes }));
      return { error: null };
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single();
    if (!error) {
      setProfile(data);
      cacheProfile(data, session.user.email);
    }
    return { data, error };
  };

  const signOut = async () => {
    if (session && supabase) {
      await supabase.from('profiles').update({ status: 'Offline', last_seen: new Date().toISOString() }).eq('id', session.user.id);
      await supabase.auth.signOut();
    }
    localStorage.removeItem('loggedin');
    setSession(null);
    setProfile(null);
  };

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    online: isOnlineMode,
    refreshProfile,
    updateProfile,
    signOut,
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

