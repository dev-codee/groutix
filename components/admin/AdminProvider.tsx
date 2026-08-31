"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/roles";

// Carries the (configurable) admin base path and the signed-in user's role from
// the server layout down to client components so links, redirects, and
// role-gated UI all use the right values.
type AdminContextValue = {
  basePath: string;
  role: Role;
  username: string;
};

const AdminContext = createContext<AdminContextValue>({
  basePath: "/admin",
  role: "manager",
  username: "",
});

export function AdminProvider({
  basePath,
  role,
  username,
  children,
}: {
  basePath: string;
  role: Role;
  username: string;
  children: React.ReactNode;
}) {
  return (
    <AdminContext.Provider value={{ basePath, role, username }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminBasePath(): string {
  return useContext(AdminContext).basePath;
}

export function useAdminRole(): Role {
  return useContext(AdminContext).role;
}

export function useAdminUsername(): string {
  return useContext(AdminContext).username;
}
