import { useState, useEffect, useCallback } from "react";

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  role: string;
  name: string;
  email: string;
}

const IS_LOCALHOST = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export function useAuth() {
  const [state, setState] = useState<AuthState>(
    IS_LOCALHOST
      ? { authenticated: true, loading: false, role: "admin", name: "Archer", email: "archer@beyondtherhythm.org" }
      : { authenticated: false, loading: true, role: "", name: "", email: "" }
  );

  const verify = useCallback(async () => {
    if (IS_LOCALHOST) return;
    try {
      const res = await fetch("/api/auth/verify", { credentials: "include" });
      const data = await res.json();
      setState({ authenticated: data.authenticated === true, loading: false, role: data.role ?? "", name: data.name ?? "", email: data.email ?? "" });
    } catch {
      setState({ authenticated: false, loading: false, role: "", name: "", email: "" });
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
        setState({ authenticated: true, loading: false, role: data.role ?? "", name: data.name ?? "", email: data.email ?? "" });
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
      setState({ authenticated: false, loading: false, role: "", name: "", email: "" });
    }
  };

  const setEmail = (email: string) => {
    setState((prev) => ({ ...prev, email }));
  };

  return { ...state, login, logout, setEmail };
}
