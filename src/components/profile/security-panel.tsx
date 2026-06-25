"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  KeyRound,
  Loader2,
  Shield,
} from "lucide-react";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toast";
import {
  changeAccountPassword,
  getSignInMethods,
  hasEmailPasswordProvider,
  hasGoogleProvider,
  sendAccountPasswordReset,
} from "@/lib/account-security";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

type Panel = "password" | null;

export function SecurityPanel({ user }: { user: User }) {
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasPassword = hasEmailPasswordProvider(user);
  const hasGoogle = hasGoogleProvider(user);
  const signInMethods = useMemo(() => getSignInMethods(user), [user]);

  const resetForms = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const togglePanel = (panel: Panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
    resetForms();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await changeAccountPassword(
        user,
        hasPassword ? currentPassword : "",
        newPassword
      );
      resetForms();
      setOpenPanel(null);
      showToast(
        "success",
        hasPassword
          ? "Password updated successfully."
          : "Password set. You can now sign in with email and password too."
      );
    } catch (err) {
      showToast("error", getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetEmail = async () => {
    if (!user.email) return;
    setLoading(true);
    try {
      await sendAccountPasswordReset(user.email);
      showToast("success", "Password reset email sent. Check your inbox.");
    } catch (err) {
      showToast("error", getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const rows: { id: Panel; label: string; description: string; icon: typeof KeyRound }[] =
    [
      {
        id: "password",
        label: hasPassword ? "Change Password" : "Set Password",
        description: hasPassword
          ? "Update your email & password login credentials."
          : hasGoogle
            ? "Add a password so you can also sign in with email."
            : "Create a password for your account.",
        icon: KeyRound,
      },
    ];

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            Security
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {signInMethods.map((method) => (
              <Badge
                key={method}
                variant="secondary"
                className="border-indigo-100 bg-indigo-50 text-indigo-700"
              >
                {method}
              </Badge>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Signed in as <span className="font-medium text-gray-800">{user.email}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pt-6">
        {rows.map((row) => {
          const Icon = row.icon;
          const isOpen = openPanel === row.id;
          return (
            <div
              key={row.id}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"
              )}
            >
              <button
                type="button"
                onClick={() => togglePanel(row.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-gray-50"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                    <Icon className="h-4 w-4 text-indigo-600" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {row.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {row.description}
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && row.id === "password" && (
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4 border-t border-gray-200 bg-white p-4"
                >
                  {hasGoogle && !hasPassword && (
                    <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      A Google sign-in popup will open to confirm it is you before
                      setting your password.
                    </p>
                  )}

                  {hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        {hasPassword ? "New password" : "Password"}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={loading} className="gap-2">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {hasPassword ? "Update password" : "Set password"}
                    </Button>
                    {hasPassword && user.email && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={handlePasswordResetEmail}
                      >
                        Send reset email
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          );
        })}

        <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your account is secured with Firebase Authentication. Sensitive changes
            require you to verify your identity first.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
