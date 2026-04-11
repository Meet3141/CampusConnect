import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login — server sets access + refresh token cookies; we receive the user object
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
  };

  // Logout — server clears cookies; we clear local state
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Swallow errors — clear state regardless
    }
    setUser(null);
  };

  // Verify session on app load — reads the HttpOnly cookie automatically
  const verify = async () => {
    try {
      const res = await api.get("/auth/verify");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
