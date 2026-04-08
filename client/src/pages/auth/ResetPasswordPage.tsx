import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Bike,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { company } from "@/lib/data";
import { SERVER_URL } from "@/lib/server";

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "No reset token found. Please request a new reset link.",
        variant: "destructive",
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (form.password !== form.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        toast({
          title: "Reset Failed",
          description: data.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasToken = !!token;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left - Branding */}
      <div className="lg:w-1/2 bg-primary p-2 md:p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1/2 mx-auto flex justify-center">
              <Link to="/">
                <img
                  src="https://res.cloudinary.com/dm7ohxd3v/image/upload/v1773229288/tris-acadamy-logo_w8tqzv_axhwvs.png"
                  alt="Tris Motorcycles"
                  className="h-auto w-48 max-w-xs object-contain"
                />
              </Link>
            </div>
          </div>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-md">
            Choose a strong, unique password to keep your account secure.
          </p>
          <div className="space-y-3">
            {[
              "At least 6 characters long",
              "Mix of letters and numbers",
              "Avoid common passwords",
            ].map((tip) => (
              <div
                key={tip}
                className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg px-4 py-2"
              >
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span className="text-primary-foreground/80 text-sm">
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-2 md:p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Set New Password</CardTitle>
              <CardDescription>
                Enter a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasToken ? (
                <div className="text-center py-6 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <ShieldAlert className="w-8 h-8 text-destructive" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Invalid Reset Link
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This reset link is missing a token. Please request a new
                      password reset.
                    </p>
                  </div>
                  <Link to="/forgot-password">
                    <Button className="w-full bg-accent text-white hover:bg-accent/90">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              ) : success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Password Reset!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your password has been successfully updated. You can now
                      log in with your new password.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-accent text-white hover:bg-accent/90"
                    onClick={() => navigate("/")}
                  >
                    Go to Login
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, password: e.target.value }))
                        }
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password match indicator */}
                  {form.confirmPassword && (
                    <p
                      className={`text-xs flex items-center gap-1 ${
                        form.password === form.confirmPassword
                          ? "text-green-600"
                          : "text-destructive"
                      }`}
                    >
                      {form.password === form.confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Passwords match
                        </>
                      ) : (
                        "Passwords do not match"
                      )}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-accent text-white hover:bg-accent/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="animate-spin w-5 h-5" />
                        Resetting...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
