import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

const normalizeUser = (value) => {
  if (!value) return null;
  return { ...value, id: value.id || value._id };
};

const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (err) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("token", token); else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user)); else localStorage.removeItem("user");
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(normalizeUser(data.user));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      if (data.token && data.user) {
        setToken(data.token);
        setUser(normalizeUser(data.user));
      } else {
        setToken(null);
        setUser(null);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auth/me");
      const normalized = normalizeUser(data);
      setUser(normalized);
      return normalized;
    } catch (err) {
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const role = useMemo(() => user?.role || decodeJwt(token)?.role || null, [user, token]);

  return (
    <AuthContext.Provider value={{ user, token, role, login, register, refreshUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
