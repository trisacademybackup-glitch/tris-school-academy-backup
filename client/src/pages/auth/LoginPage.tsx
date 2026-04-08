import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Bike,
  Shield,
  Users,
  GraduationCap,
  Eye,
  EyeOff,
  Loader,
  CircleCheckBig,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { company } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVER_URL } from "@/lib/server";

const LoginPage = () => {
  const { login, register } = useAuth();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    code: "",
    category: "noob",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  // Tabs default: login for small screens, register for large
  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 1024;
  const [tabValue, setTabValue] = useState(isSmallScreen ? "login" : "login");

  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    category: "noob",
    code: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      const res = await login(loginForm.email, loginForm.password);

      if (!res) {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      } else if (res.status === 403) {
        setShowCategoryPrompt(true);
        setCategoryForm({ category: "noob", code: "" });
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${SERVER_URL}/admin/update-user-email/${loginForm.email}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: categoryForm.category,
            code: categoryForm.code,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Updated",
          description: "Category updated successfully.",
        });
        setShowCategoryPrompt(false);
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.message || "Update failed",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error.",
        variant: "destructive",
      });
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    setLoadingRegister(true);
    try {
      const result = await register({
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        password: regForm.password,
        confirmPassword: regForm.confirmPassword,
        category: regForm.category,
        code: regForm.code,
      });
      if (typeof result === "string") {
        toast({ title: "Error", description: result, variant: "destructive" });
      }
    } finally {
      setLoadingRegister(false);
    }
  };

  const features = [
    {
      icon: Bike,
      title: "Expert Instructors",
      desc: "Learn from certified professionals",
    },
    {
      icon: Shield,
      title: "Safe Learning Environment",
      desc: "Train in a realistic road simulation with personalized one-on-one instruction.",
    },
    {
      icon: Users,
      title: "Flexible Scheduling",
      desc: "Book classes that fit your schedule",
    },
    {
      icon: GraduationCap,
      title: "High Pass Rate",
      desc: "98% first-time pass rate",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {showCategoryPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleCategorySubmit}
            className="bg-white p-8 rounded-xl shadow-xl min-w-[340px] space-y-4"
          >
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cat-category">Category</Label>
                <Select
                  value={categoryForm.category}
                  onValueChange={(v) =>
                    setCategoryForm((f) => ({ ...f, category: v }))
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noob">Noob</SelectItem>
                    <SelectItem value="ultimate">Ultimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-code">Verification Code</Label>
                <Input
                  id="cat-code"
                  placeholder="Enter code issued by admin"
                  value={categoryForm.code}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, code: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-accent text-white hover:bg-accent/90"
              disabled={loadingLogin}
            >
              {loadingLogin ? "Saving..." : "Save"}
            </Button>
          </form>
        </div>
      )}
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
          <div className="flex items-center gap-3 mt-2 mb-8">
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
          <p className="text-xl text-primary-foreground/80 mb-12 max-w-md">
            Your journey to confident driving starts here. Book classes, track
            progress, and ace your test.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4"
              >
                <f.icon className="w-6 h-6 text-white mb-2" />
                <h3 className="font-display font-semibold text-primary-foreground text-sm">
                  {f.title}
                </h3>
                <p className="text-primary-foreground/60 text-xs mt-1">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Auth Forms */}
      <div className="lg:w-1/2 flex items-center justify-center p-2 md:p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm((p) => ({ ...p, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          tabIndex={-1}
                          onClick={() => setShowLoginPassword((v) => !v)}
                          aria-label={
                            showLoginPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-accent text-white hover:bg-accent/90"
                      disabled={loadingLogin}
                    >
                      {loadingLogin ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="animate-spin w-5 h-5" /> loading...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <div className="flex items-center ">
                      <span>You don't have an account? </span>
                      <span
                        onClick={() => setTabValue("register")}
                        className="text-primary hover:underline ml-2 cursor-pointer"
                      >
                        Register here
                      </span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">
                    Create student account
                  </CardTitle>
                  <CardDescription>
                    Sign up to start booking driving classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        placeholder="John Doe"
                        value={regForm.name}
                        onChange={(e) =>
                          setRegForm((p) => ({ ...p, name: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={regForm.email}
                        onChange={(e) =>
                          setRegForm((p) => ({ ...p, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone</Label>
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="0712345678"
                        value={regForm.phone}
                        onChange={(e) =>
                          setRegForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="reg-password"
                            type={showRegPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={regForm.password}
                            onChange={(e) =>
                              setRegForm((p) => ({
                                ...p,
                                password: e.target.value,
                              }))
                            }
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                            tabIndex={-1}
                            onClick={() => setShowRegPassword((v) => !v)}
                            aria-label={
                              showRegPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showRegPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="reg-confirm"
                            type={showRegConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            value={regForm.confirmPassword}
                            onChange={(e) =>
                              setRegForm((p) => ({
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
                            onClick={() => setShowRegConfirm((v) => !v)}
                            aria-label={
                              showRegConfirm ? "Hide password" : "Show password"
                            }
                          >
                            {showRegConfirm ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="reg-category">Category</Label>
                        <Select
                          value={regForm.category || "noob"}
                          onValueChange={(v) =>
                            setRegForm((p) => ({ ...p, category: v }))
                          }
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noob">Noob</SelectItem>
                            <SelectItem value="ultimate">Ultimate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-code">Verification Code</Label>
                        <Input
                          id="reg-code"
                          placeholder="Enter code issued by admin"
                          value={regForm.code || ""}
                          onChange={(e) =>
                            setRegForm((p) => ({ ...p, code: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-accent text-white hover:bg-accent/90"
                      disabled={loadingRegister}
                    >
                      {loadingRegister ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="animate-spin w-5 h-5" /> loading...
                        </span>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                  <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                    <p className="font-semibold flex gap-1">
                      <CircleCheckBig className="h-4 w-4" />{" "}
                      <Link to="/terms">
                        By Signing In you agree to our terms and conditions.
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
