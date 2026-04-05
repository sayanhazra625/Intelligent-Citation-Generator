"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  name: z.string().min(2),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different",
  path: ["newPassword"]
});

function getDefaultAvatar(name?: string, email?: string) {
  const seed = encodeURIComponent(name || email || "user");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=3b82f6&textColor=ffffff&fontSize=40`;
}

export default function SettingsPage() {
  const { user, checkAuth, logout } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const avatarSrc = user?.avatar || getDefaultAvatar(user?.name, user?.email);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  // Keep form in sync if user loads later
  useEffect(() => {
    if (user?.name && !profileForm.getValues("name")) {
      profileForm.setValue("name", user.name);
    }
  }, [user, profileForm]);

  // Avatar upload handler
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    // Validate size (max 500KB)
    if (file.size > 500000) {
      toast({ title: "Image too large", description: "Maximum size is 500KB.", variant: "destructive" });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          await axiosInstance.put("/user/avatar", { avatar: base64 });
          await checkAuth(); // refresh user state
          toast({ title: "Avatar updated!" });
        } catch (error: any) {
          toast({ title: "Upload failed", description: error.response?.data?.message || "Try a smaller image.", variant: "destructive" });
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingAvatar(false);
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function handleRemoveAvatar() {
    try {
      setIsUploadingAvatar(true);
      await axiosInstance.delete("/user/avatar");
      await checkAuth();
      toast({ title: "Avatar removed" });
    } catch {
      toast({ title: "Failed to remove avatar", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    try {
      setIsUpdatingProfile(true);
      await axiosInstance.put("/user/profile", values);
      await checkAuth(); // refresh user store
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.response?.data?.message, variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      setIsUpdatingPassword(true);
      await axiosInstance.put("/user/password", values);
      toast({ title: "Password updated successfully" });
      passwordForm.reset();
    } catch (error: any) {
      toast({ title: "Update failed", description: error.response?.data?.message, variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("WARNING: This will permanently delete your account, projects, and citations. This cannot be undone.")) return;
    
    try {
      setIsDeleting(true);
      await axiosInstance.delete("/user/account");
      toast({ title: "Account deleted" });
      await logout();
      router.push("/");
    } catch (error) {
      toast({ title: "Failed to delete account", variant: "destructive" });
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a photo or use your auto-generated avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-primary/5 text-primary text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                  </Button>
                  {user?.avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 500KB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <Input value={user?.email || ""} disabled />
                  <FormDescription>Your email address is managed by identity providers (if Google Auth) and cannot be changed here.</FormDescription>
                </FormItem>
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        {user?.email && (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone Card */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Permanently delete your account and all of your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground w-full max-w-lg">
                Once you delete your account, there is no going back. Please be certain. All your projects, generated citations, and data will be wiped according to our GDPR retention policy.
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
