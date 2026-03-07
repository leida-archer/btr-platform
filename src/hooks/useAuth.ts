import { useState, useEffect, useCallback } from "react";

interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ authenticated: false, loading: true });

  const verify = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify", { credentials: "include" });
      const data = await res.json();
      setState({ authenticated: data.authenticated === true, loading: false });
    } catch {
      setState({ authenticated: false, loading: false });
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setState({ authenticated: true, loading: false });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setState({ authenticated: false, loading: false });
    }
  };

  return { ...state, login, logout };
}
