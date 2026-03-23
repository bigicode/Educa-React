import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import {
  applyAuthToken,
  clearStoredAuthToken,
  fetchCurrentUser,
  loginUser,
  persistAuthToken,
  readStoredAuthToken,
} from "./api";

function getInitialAuthState() {
  const storedToken = readStoredAuthToken();

  if (storedToken) {
    applyAuthToken(storedToken);

    return {
      user: null,
      token: storedToken,
      isReady: false,
    };
  }

  return {
    user: null,
    token: null,
    isReady: true,
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);

  useEffect(() => {
    if (!authState.token) {
      return undefined;
    }

    let isActive = true;

    fetchCurrentUser()
      .then((currentUser) => {
        if (!isActive) {
          return;
        }

        setAuthState((current) => ({
          ...current,
          user: currentUser,
          isReady: true,
        }));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        clearStoredAuthToken();
        applyAuthToken(null);
        setAuthState({
          user: null,
          token: null,
          isReady: true,
        });
      });

    return () => {
      isActive = false;
    };
  }, [authState.token]);

  async function login(credentials, options = {}) {
    const session = await loginUser(credentials);

    persistAuthToken(session.accessToken, options.remember ?? true);
    applyAuthToken(session.accessToken);
    setAuthState({
      user: session.user,
      token: session.accessToken,
      isReady: true,
    });

    return session;
  }

  async function refreshSession() {
    const currentUser = await fetchCurrentUser();
    setAuthState((current) => ({
      ...current,
      user: currentUser,
      isReady: true,
    }));
    return currentUser;
  }

  function logout() {
    clearStoredAuthToken();
    applyAuthToken(null);
    setAuthState({
      user: null,
      token: null,
      isReady: true,
    });
  }

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      isReady: authState.isReady,
      isAuthenticated: Boolean(authState.user && authState.token),
      login,
      logout,
      refreshSession,
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
