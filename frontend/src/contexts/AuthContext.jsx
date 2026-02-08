// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { _id, username, fullName, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ============================
     INITIALIZE AUTH ON APP LOAD
  ============================ */
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(storedToken);

      //  Token expired
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) {
        logout();
        setLoading(false);
        return;
      }

      //  Rebuild user ONLY from token (source of truth)
      const restoredUser = {
        _id: decoded.id,
        role: decoded.role,
      };

      // Optional UI data (non-authoritative)
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        if (parsed?.username) restoredUser.username = parsed.username;
        if (parsed?.fullName) restoredUser.fullName = parsed.fullName;
      }

      setToken(storedToken);
      setUser(restoredUser);
    } catch (err) {
      console.log(err);
      console.warn("Invalid token. Logging out.");
      logout();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  /* ============================
     LOGIN
  ============================ */
 const login = async ({ username, password }) => {
  try {
    const res = await API.post("/auth/login", { username, password });

    const {
      token: jwtToken,
      role,
      fullName,
      username: uname,
      _id,
    } = res.data;

    const userObj = {
      _id,
      role,
      fullName,
      username: uname,
    };

    // Persist
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userObj));

    setToken(jwtToken);
    setUser(userObj);

    return { ok: true, user: userObj };
  } catch (err) {
    return {
      ok: false,
      error: err?.response?.data?.message || "Invalid username or password",
    };
  }
};

  /* ============================
     LOGOUT
  ============================ */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  /* ============================
     CONTEXT VALUE
  ============================ */
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
        isAdmin: user?.role === "admin",
        isEmployee: user?.role === "employee",
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

/* ============================
   HOOK
============================ */
export const useAuth = () => useContext(AuthContext);
