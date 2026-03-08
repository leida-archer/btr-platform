import { createContext, useContext } from "react";

const RoleContext = createContext<string>("viewer");

export function RoleProvider({ role, children }: { role: string; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

export function useIsViewer() {
  return useContext(RoleContext) === "viewer";
}
