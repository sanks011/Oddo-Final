"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
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

  useEffect(() => {
    setIsAuthenticated(!!getCookie("auth-token"));
  }, []);

  const login = useCallback((token = "demo-session-token") => {
    document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    document.cookie = "auth-token=; path=/; max-age=0";
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
