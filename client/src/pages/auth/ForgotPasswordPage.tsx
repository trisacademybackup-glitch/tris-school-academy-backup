import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { ArrowLeft, Mail, Loader, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SERVER_URL } from "@/lib/server";

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset email",
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
            No worries — it happens to the best of us. We'll send you a secure
            link to reset your password.
          </p>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 max-w-sm">
            <Mail className="w-6 h-6 text-white mb-2" />
            <h3 className="font-semibold text-primary-foreground mb-1">
              Check your inbox
            </h3>
            <p className="text-primary-foreground/60 text-sm">
              The reset link expires in 1 hour for security.
            </p>
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
              <CardTitle className="font-display">Forgot Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your
                password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
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
                      Check your email
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      If{" "}
                      <span className="font-medium text-foreground">
                        {email}
                      </span>{" "}
                      is registered, we've sent a password reset link. Check
                      your inbox (and spam folder).
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The link expires in 1 hour.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                  >
                    Send another link
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-accent text-white hover:bg-accent/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="animate-spin w-5 h-5" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Reset Link
                      </span>
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

export default ForgotPasswordPage;
