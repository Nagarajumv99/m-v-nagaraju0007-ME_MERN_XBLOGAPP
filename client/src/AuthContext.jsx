import { createContext, useContext, useMemo, useState } from 'react';
import { api, jsonBody } from './api';

const AuthContext = createContext(null);

function readSession() {
  try {
    return JSON.parse(localStorage.getItem('xblog-session') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  function saveSession(nextSession) {
    localStorage.setItem('xblog-session', JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function login(email, password) {
    const result = await api('/auth/login', {
      method: 'POST',
      body: jsonBody({ email, password })
    });
    saveSession(result);
    return result.user;
  }

  async function signup(details) {
    const result = await api('/auth/register', {
      method: 'POST',
      body: jsonBody(details)
    });
    saveSession(result);
    return result.user;
  }

  async function googleLogin(googleIdToken) {
    const result = await api('/auth/google-login', {
      method: 'POST',
      body: jsonBody({ googleIdToken })
    });
    saveSession(result);
    return result.user;
  }

  function logout() {
    localStorage.removeItem('xblog-session');
    setSession(null);
  }

  function updateUser(profile) {
    const updated = { ...session, user: { ...session?.user, ...profile } };
    saveSession(updated);
  }

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    login,
    signup,
    googleLogin,
    updateUser,
    logout
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
