import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/services";
import { TOKEN_KEY } from "../api/client";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setUser(null); }, []);

  // On first load, restore the session from a stored token.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.me().then(setUser).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, []);

  // The axios interceptor fires this when the server rejects the token.
  useEffect(() => { window.addEventListener("auth:logout", logout); return () => window.removeEventListener("auth:logout", logout); }, [logout]);

  const login = async (email, password) => {
    const { token, user } = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, token); setUser(user);
    return user;
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>{children}</AuthContext.Provider>;
}
