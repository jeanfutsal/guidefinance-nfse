"use client";

import React, { createContext, useContext, useState } from "react";

interface SidebarContextType {
  isMobileOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openSidebar = () => setIsMobileOpen(true);
  const closeSidebar = () => setIsMobileOpen(false);
  const toggleSidebar = () => setIsMobileOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isMobileOpen, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
