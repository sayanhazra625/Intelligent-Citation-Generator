"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await axiosInstance.get(`/auth/verify/${token}`);
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been successfully verified! You can now log in.");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Invalid or expired verification link.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="container relative min-h-[calc(100vh-140px)] flex-col items-center justify-center grid">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] text-center border p-8 rounded-xl shadow-sm bg-card">
        
        {status === "loading" && (
          <>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Verifying email...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we verify your link.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Email Verified!</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link href="/login" className="mt-4">
              <Button className="w-full">Continue to Login</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2 text-destructive">
              <XCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Verification Failed</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link href="/login" className="mt-4">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
