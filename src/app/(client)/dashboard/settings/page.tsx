"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, AtSign, Shield, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
  });

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        username: (session.user as { username?: string }).username || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Profile updated" });
        // Refresh session so new data appears across the app
        await update();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const changed =
    form.name !== (session?.user?.name || "") ||
    form.username !== ((session?.user as { username?: string })?.username || "") ||
    form.email !== (session?.user?.email || "");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              <User className="inline h-4 w-4 mr-1" />
              Full Name
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              <AtSign className="inline h-4 w-4 mr-1" />
              Username
            </Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="your_username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-1" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              <Shield className="inline h-4 w-4 mr-1" />
              Role
            </Label>
            <Input id="role" value={session?.user?.role || "CLIENT"} disabled />
            <p className="text-xs text-muted-foreground">Role can only be changed by an administrator.</p>
          </div>

          <Button onClick={handleSave} disabled={!changed || saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Password and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To reset your password, please contact the administrator or sign out and use the forgot password flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
