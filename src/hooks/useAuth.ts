import { useState, useEffect, useCallback } from "react";

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  role: string;
  name: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ authenticated: false, loading: true, role: "", name: "" });

  const verify = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify", { credentials: "include" });
      const data = await res.json();
      setState({ authenticated: data.authenticated === true, loading: false, role: data.role ?? "", name: data.name ?? "" });
    } catch {
      setState({ authenticated: false, loading: false, role: "", name: "" });
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setState({ authenticated: true, loading: false, role: data.role ?? "", name: data.name ?? "" });
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
      setState({ authenticated: false, loading: false, role: "", name: "" });
    }
  };

  return { ...state, login, logout };
}
