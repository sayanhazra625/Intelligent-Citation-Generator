"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, FolderKanban, LogOut, Settings, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const links = [
    { name: "Generator", href: "/dashboard", icon: Sparkles },
    { name: "Library", href: "/library", icon: BookMarked },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 border-r bg-muted/20 min-h-screen p-4">
      <Link href="/" className="flex items-center space-x-2 mb-8 px-2">
        <span className="font-bold text-2xl leading-none">
          Cite<span className="text-primary">Gen</span>.
        </span>
      </Link>
      
      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <button 
        onClick={logout}
        className="flex items-center space-x-3 px-3 py-2.5 mt-auto rounded-md transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        <span>Log out</span>
      </button>
    </div>
  );
}
