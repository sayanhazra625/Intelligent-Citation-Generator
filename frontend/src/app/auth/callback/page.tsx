"use client";

import { Suspense } from "react";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Store tokens temporarily so we can fetch profile
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Fetch user profile to populate store
      axiosInstance.get("/user/profile").then((res) => {
        if (res.data.success) {
          setAuth(res.data.data, accessToken, refreshToken);
          router.push("/dashboard");
        }
      }).catch(() => {
        router.push("/login?error=google_auth_failed");
      });
    } else {
      router.push("/login?error=missing_tokens");
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center flex-col space-y-4"><div className="h-8 w-8 animate-spin text-primary rounded-full border-b-2"></div><p className="text-muted-foreground">Loading...</p></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
