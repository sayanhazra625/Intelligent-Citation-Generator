"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl leading-none">
            Cite<span className="text-primary">Gen</span>.
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Why Free?</Link>
        </nav>
        <div className="flex items-center space-x-4">
          {isLoading ? (
             <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
