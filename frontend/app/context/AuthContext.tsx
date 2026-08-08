"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "USER";
  orgId?: string;
  orgSlug?: string;
  verificationStatus?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (token?: string, user?: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const hasToken = getCookie("auth-token") || getCookie("access-token");
    setIsAuthenticated(!!hasToken);
    // Restore user from localStorage if available
    try {
      const saved = localStorage.getItem("auth-user");
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  const login = useCallback((token = "demo-session-token", authUser?: AuthUser) => {
    document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    document.cookie = `access-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    setIsAuthenticated(true);
    if (authUser) {
      setUser(authUser);
      try { localStorage.setItem("auth-user", JSON.stringify(authUser)); } catch {}
    }
  }, []);

  const logout = useCallback(() => {
    document.cookie = "auth-token=; path=/; max-age=0";
    document.cookie = "access-token=; path=/; max-age=0";
    document.cookie = "refresh-token=; path=/; max-age=0";
    document.cookie = "super-admin-auth=; path=/; max-age=0";
    setIsAuthenticated(false);
    setUser(null);
    try { localStorage.removeItem("auth-user"); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
