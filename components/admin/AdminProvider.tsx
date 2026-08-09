"use client";

import { createContext, useContext } from "react";

// Carries the (configurable) admin base path from the server layout down to
// client components so links and redirects point at the right public URL.
const AdminContext = createContext<{ basePath: string }>({ basePath: "/admin" });

export function AdminProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return <AdminContext.Provider value={{ basePath }}>{children}</AdminContext.Provider>;
}

export function useAdminBasePath(): string {
  return useContext(AdminContext).basePath;
}
