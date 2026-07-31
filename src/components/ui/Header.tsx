"use client";

import { Bell, Search, Sun, Moon, Menu } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "./SidebarContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [dark, setDark] = useState(true);
  const { toggleSidebar } = useSidebar();

  function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setDark(!dark);
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
      {/* Title & Hamburger button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Alternar menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-input text-sm text-muted-foreground w-48 cursor-pointer hover:text-foreground transition-colors">
          <Search size={14} />
          <span>Buscar nota…</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Alternar tema"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow">
          GF
        </div>
      </div>
    </header>
  );
}
