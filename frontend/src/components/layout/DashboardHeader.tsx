"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getDefaultAvatar(name?: string, email?: string) {
  // Use DiceBear Avatars API for a unique default avatar based on the user's name
  const seed = encodeURIComponent(name || email || "user");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=3b82f6&textColor=ffffff&fontSize=40`;
}

export default function DashboardHeader() {
  const { user, logout } = useAuthStore();

  const avatarSrc = user?.avatar || getDefaultAvatar(user?.name, user?.email);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-background">
      <div className="flex-1" /> {/* Spacer for later (e.g. search bar) */}
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-9 w-9 border cursor-pointer hover:opacity-80 transition">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback className="bg-primary/5 text-primary">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={logout} 
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
