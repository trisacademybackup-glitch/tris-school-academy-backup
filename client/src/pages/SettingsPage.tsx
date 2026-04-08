import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SERVER_URL } from "@/lib/server";
import * as store from "@/lib/store";
import {
  Trash2,
  Plus,
  Bell,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Pencil,
  BookOpen,
  BanIcon,
  SunIcon,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Loader,
  PenLine,
  RotateCcw,
  Save,
} from "lucide-react";
import { invalidateSignatureCache } from "@/lib/certificate";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppNotification {
  _id: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  active: boolean;
  date?: string | null;
  venue?: string | null;
  expiryDate?: string | null;
  createdAt: string;
}

interface BlockedSlot {
  _id: string;
  date: string;
  from: string;
  to: string;
  reason: string;
}

interface AppSettings {
  bookingAheadDays: number;
  defaultSlots: string[];
  blockedSlots: BlockedSlot[];
  unblockedSundays: string[];
  allowMultipleStudentsPerSlot: boolean;
  studentsPerSlot: number;
  allowMultipleBookingsPerDay: boolean;
  maxBookingsPerDay: number;
  dropBookingHours: number;
  notifications: AppNotification[];
}

interface RegistrationCode {
  _id: string;
  code: string;
  category: "noob" | "ultimate";
  used: boolean;
  maxClasses?: number | null;
  expirationDate?: string | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const token = () => localStorage.getItem("token");

const notifTypeConfig = {
  info: { label: "Info", icon: Info, color: "text-blue-500" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-yellow-500" },
  success: { label: "Success", icon: CheckCircle2, color: "text-green-500" },
  error: { label: "Error", icon: XCircle, color: "text-red-500" },
};

// ─── ChangePasswordCard ────────────────────────────────────────────────────────

// Move PasswordInput outside the main component
const PasswordInput = React.memo(
  ({
    id,
    label,
    field,
    showField,
    value,
    onChange,
    show,
    onToggleShow,
  }: {
    id: string;
    label: string;
    field: string;
    showField: string;
    value: string;
    onChange: (field: string, value: string) => void;
    show: boolean;
    onToggleShow: (showField: string) => void;
  }) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(field, e.target.value);
      },
      [field, onChange],
    );

    const handleToggle = React.useCallback(() => {
      onToggleShow(showField);
    }, [showField, onToggleShow]);

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            type={show ? "text" : "password"}
            placeholder="••••••••"
            value={value}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            tabIndex={-1}
            onClick={handleToggle}
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

const ChangePasswordCard = () => {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = React.useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = React.useState(false);

  // Stable handlers
  const handlePasswordChange = React.useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const toggleShow = React.useCallback((field: string) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully.",
        });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <PasswordInput
            id="current-pw"
            label="Current Password"
            field="currentPassword"
            showField="current"
            value={form.currentPassword}
            onChange={handlePasswordChange}
            show={show.current}
            onToggleShow={toggleShow}
          />
          <PasswordInput
            id="new-pw"
            label="New Password"
            field="newPassword"
            showField="new"
            value={form.newPassword}
            onChange={handlePasswordChange}
            show={show.new}
            onToggleShow={toggleShow}
          />
          <PasswordInput
            id="confirm-pw"
            label="Confirm New Password"
            field="confirmPassword"
            showField="confirm"
            value={form.confirmPassword}
            onChange={handlePasswordChange}
            show={show.confirm}
            onToggleShow={toggleShow}
          />
          {form.confirmPassword && (
            <p
              className={`text-xs flex items-center gap-1 ${
                form.newPassword === form.confirmPassword
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              {form.newPassword === form.confirmPassword ? (
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
            className="bg-accent text-white hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader className="animate-spin w-4 h-4" /> Changing...
              </span>
            ) : (
              "Change Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// ─── SettingsPage ─────────────────────────────────────────────────────────────

// ─── SignaturePadCard ──────────────────────────────────────────────────────────

const SignaturePadCard = () => {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);
  const lastPos = React.useRef<{ x: number; y: number } | null>(null);

  const [savedSignature, setSavedSignature] = React.useState<string | null>(
    null,
  );
  const [sigName, setSigName] = React.useState("TRIS");
  const [sigTitle, setSigTitle] = React.useState("TRIS ACADEMY");
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(true);
  const [hasDrawn, setHasDrawn] = React.useState(false);

  const token = () => localStorage.getItem("token");

  // ── Fetch existing signature ──
  React.useEffect(() => {
    setLoading(true);
    fetch(`${SERVER_URL}/settings/signature`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSavedSignature(data.adminSignature || null);
          setSigName(data.adminSignatureName || "TRIS");
          setSigTitle(data.adminSignatureTitle || "TRIS ACADEMY");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Canvas helpers ──
  const getPos = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsEmpty(true);
    setHasDrawn(false);
  }, []);

  React.useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const startDraw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
    setHasDrawn(true);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  };

  const stopDraw = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleClear = () => {
    initCanvas();
  };

  // ── Save ──
  const handleSave = async () => {
    const canvas = canvasRef.current!;
    // If there's a drawn signature, encode it; otherwise keep null (clear)
    const dataUrl = hasDrawn && !isEmpty ? canvas.toDataURL("image/png") : null;

    setSaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/settings/signature`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          adminSignature: dataUrl,
          adminSignatureName: sigName,
          adminSignatureTitle: sigTitle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSignature(dataUrl);
        invalidateSignatureCache();
        toast({
          title: "Signature saved",
          description: "All future certificates will use this signature.",
        });
        // Clear the pad after saving
        initCanvas();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save.",
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
      setSaving(false);
    }
  };

  // ── Remove signature ──
  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/settings/signature`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ adminSignature: null }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSignature(null);
        invalidateSignatureCache();
        initCanvas();
        toast({
          title: "Signature removed",
          description: "Certificates will use the default signature.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove signature.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <PenLine className="h-5 w-5 text-primary" />
          Certificate Signature
        </CardTitle>
        <CardDescription>
          Draw your signature below — it will appear on all student completion
          certificates. Use a finger on a touch device for best results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Currently saved signature preview */}
            {savedSignature && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Current saved signature
                </p>
                <div className="rounded-xl border bg-white dark:bg-gray-950 p-4 flex items-center justify-between gap-4">
                  <img
                    src={savedSignature}
                    alt="Saved admin signature"
                    className="h-16 object-contain"
                    style={{ filter: "contrast(1.1)" }}
                  />
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-sm font-semibold">{sigName}</span>
                    <span className="text-xs text-muted-foreground italic">
                      {sigTitle}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={handleRemove}
                  disabled={saving}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove signature
                </Button>
              </div>
            )}

            {!savedSignature && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                No signature saved. Certificates will use the default signature
                until you draw and save one.
              </div>
            )}

            <Separator />

            {/* Draw new signature */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {savedSignature
                  ? "Draw a new signature to replace"
                  : "Draw your signature"}
              </p>

              <div
                className="relative rounded-xl border-2 border-dashed border-primary/30 bg-white dark:bg-gray-950 overflow-hidden touch-none select-none"
                style={{ cursor: "crosshair" }}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full"
                  style={{ display: "block", touchAction: "none" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                {isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-muted-foreground/40 text-sm select-none">
                      ✍️ Sign here using your finger or mouse
                    </span>
                  </div>
                )}
                {/* Baseline guide */}
                <div className="absolute bottom-10 left-10 right-10 border-b border-dashed border-gray-300 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isEmpty}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Clear
                </Button>
                <span className="text-xs text-muted-foreground flex-1">
                  {isEmpty ? "Pad is empty" : "Signature drawn ✓"}
                </span>
              </div>
            </div>

            {/* Name and title fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Signatory name</Label>
                <Input
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  placeholder="e.g. TRIS"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in bold under signature
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Title / Academy</Label>
                <Input
                  value={sigTitle}
                  onChange={(e) => setSigTitle(e.target.value)}
                  placeholder="e.g. TRIS ACADEMY"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in italic under the name
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || (isEmpty && !savedSignature)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isEmpty ? "Save name & title" : "Save signature & name"}
                </span>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Settings Page ────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [profileForm, setProfileForm] = React.useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Admin state
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  // Notifications
  const [newNotifMsg, setNewNotifMsg] = useState("");
  const [newNotifType, setNewNotifType] = useState<
    "info" | "warning" | "success" | "error"
  >("info");
  const [newNotifDate, setNewNotifDate] = useState("");
  const [newNotifVenue, setNewNotifVenue] = useState("");
  const [newNotifExpiry, setNewNotifExpiry] = useState("");
  const [editNotif, setEditNotif] = useState<AppNotification | null>(null);

  // Blocked slots
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockFrom, setNewBlockFrom] = useState("09:00");
  const [newBlockTo, setNewBlockTo] = useState("13:00");
  const [newBlockReason, setNewBlockReason] = useState("");

  // Unblocked sundays
  const [newSundayDate, setNewSundayDate] = useState("");
  const [unblockingAll, setUnblockingAll] = useState(false);

  // Default slots
  const [newSlotTime, setNewSlotTime] = useState("");

  // Registration Codes
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [editCodeDialog, setEditCodeDialog] = useState<RegistrationCode | null>(
    null,
  );
  const [editCodeForm, setEditCodeForm] = useState({
    code: "",
    category: "noob" as "noob" | "ultimate",
    maxClasses: "7",
    expirationDate: "",
  });
  const [newCodeForm, setNewCodeForm] = useState({
    code: "",
    category: "noob" as "noob" | "ultimate",
    maxClasses: "7",
    expirationDate: "",
  });
  const [creatingCode, setCreatingCode] = useState(false);

  const isAdmin = user?.role === "admin";

  // ── Fetch settings ──
  useEffect(() => {
    if (!isAdmin) return;
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const res = await fetch(`${SERVER_URL}/settings`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        if (data.success) setSettings(data.settings);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch settings",
          variant: "destructive",
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [isAdmin]);

  // ── Fetch codes ──
  useEffect(() => {
    if (!isAdmin) return;
    fetchCodes();
  }, [isAdmin]);

  const fetchCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`${SERVER_URL}/admin/codes`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setCodes(data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch codes",
        variant: "destructive",
      });
    } finally {
      setLoadingCodes(false);
    }
  };

  // ── Profile save ──
  if (!user) return null;

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${SERVER_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        refreshUser();
        toast({ title: "Saved", description: "Profile settings updated." });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ── Settings API helpers ──
  const patchSettings = async (body: object) => {
    setSavingSettings(true);
    try {
      const res = await fetch(`${SERVER_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        toast({ title: "Saved", description: data.message });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const settingsApiPost = async (path: string, body: object) => {
    try {
      const res = await fetch(`${SERVER_URL}/settings${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        toast({ title: "Done", description: data.message });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      });
    }
  };

  const settingsApiDelete = async (path: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/settings${path}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        toast({ title: "Deleted", description: data.message });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      });
    }
  };

  const handleUnblockAllSundays = async () => {
    setUnblockingAll(true);
    try {
      const res = await fetch(
        `${SERVER_URL}/settings/unblocked-sundays/unblock-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ months: 12 }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        toast({
          title: "All Sundays Unblocked",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      });
    } finally {
      setUnblockingAll(false);
    }
  };

  const settingsApiPut = async (path: string, body: object) => {
    try {
      const res = await fetch(`${SERVER_URL}/settings${path}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        toast({ title: "Updated", description: data.message });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      });
    }
  };

  // ── Delete old data ──
  const handleDeleteOldData = async () => {
    setDeletingData(true);
    try {
      const res = await fetch(`${SERVER_URL}/settings/delete-old-data`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Done", description: data.message });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete old data",
        variant: "destructive",
      });
    } finally {
      setDeletingData(false);
    }
  };

  // ── Code editing ──
  const openEditCode = (c: RegistrationCode) => {
    setEditCodeForm({
      code: c.code,
      category: c.category,
      maxClasses:
        c.maxClasses !== null && c.maxClasses !== undefined
          ? String(c.maxClasses)
          : c.category === "noob"
            ? "7"
            : "",
      expirationDate: c.expirationDate ? c.expirationDate.split("T")[0] : "",
    });
    setEditCodeDialog(c);
  };

  const handleSaveCode = async () => {
    if (!editCodeDialog) return;
    if (!editCodeForm.expirationDate) {
      toast({
        title: "Missing fields",
        description: "Expiration date is required",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(
        `${SERVER_URL}/admin/codes/${editCodeDialog._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({
            code: editCodeForm.code,
            category: editCodeForm.category,
            maxClasses:
              editCodeForm.category === "ultimate" && !editCodeForm.maxClasses
                ? null
                : editCodeForm.maxClasses,
            expirationDate: editCodeForm.expirationDate || null,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "Updated", description: "Registration code updated" });
        setEditCodeDialog(null);
        fetchCodes();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update code",
        variant: "destructive",
      });
    }
  };

  const handleCreateCode = async () => {
    if (!newCodeForm.code.trim() || !newCodeForm.category) {
      toast({
        title: "Missing fields",
        description: "Code and category are required",
        variant: "destructive",
      });
      return;
    }
    if (!newCodeForm.expirationDate) {
      toast({
        title: "Missing fields",
        description: "Expiration date is required",
        variant: "destructive",
      });
      return;
    }
    setCreatingCode(true);
    try {
      const res = await fetch(`${SERVER_URL}/admin/add-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          code: newCodeForm.code.trim(),
          category: newCodeForm.category,
          maxClasses:
            newCodeForm.category === "ultimate" && !newCodeForm.maxClasses
              ? null
              : newCodeForm.maxClasses,
          expirationDate: newCodeForm.expirationDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Created",
          description: "Registration code created successfully",
        });
        setNewCodeForm({
          code: "",
          category: "noob",
          maxClasses: "7",
          expirationDate: "",
        });
        fetchCodes();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create code",
        variant: "destructive",
      });
    } finally {
      setCreatingCode(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Manage your account and application settings"
            : "Manage your account"}
        </p>
      </div>

      {/* ── Profile ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, email: e.target.value }))
              }
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            className="bg-accent text-white hover:bg-accent/90"
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* ── Change Password ───────────────────────────────────────────── */}
      <ChangePasswordCard />

      {/* ────────────────── ADMIN-ONLY SECTIONS ──────────────────────── */}
      {isAdmin && (
        <>
          {loadingSettings ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : settings ? (
            <>
              {/* ── Delete Old Data ──────────────────────────────────── */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Delete Old Data
                  </CardTitle>
                  <CardDescription>
                    Permanently delete bookings and class sessions that are more
                    than 3 weeks old.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteOldData}
                    disabled={deletingData}
                  >
                    {deletingData ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Data Older Than 3 Weeks
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will delete all bookings and class sessions with a date
                    more than 21 days before today.
                  </p>
                </CardContent>
              </Card>

              {/* ── Booking Settings ─────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Booking Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ahead days */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-base">
                        Booking Ahead Limit (days)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        How many days in advance students can book a class.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        className="w-20"
                        value={settings.bookingAheadDays}
                        onChange={(e) =>
                          setSettings((s) =>
                            s
                              ? {
                                  ...s,
                                  bookingAheadDays: Number(e.target.value),
                                }
                              : s,
                          )
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          patchSettings({
                            bookingAheadDays: settings.bookingAheadDays,
                          })
                        }
                        disabled={savingSettings}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Per-day booking limit */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          Allow Multiple Bookings Per Day
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, students can book more than one class
                          per day.
                        </p>
                      </div>
                      <Switch
                        checked={settings.allowMultipleBookingsPerDay ?? false}
                        onCheckedChange={(checked) => {
                          setSettings((s) =>
                            s
                              ? { ...s, allowMultipleBookingsPerDay: checked }
                              : s,
                          );
                          patchSettings({
                            allowMultipleBookingsPerDay: checked,
                            maxBookingsPerDay: settings.maxBookingsPerDay,
                          });
                        }}
                      />
                    </div>

                    {settings.allowMultipleBookingsPerDay && (
                      <div className="flex items-center gap-4 pl-4 border-l-2 border-primary/20">
                        <div>
                          <Label>Max Bookings Per Day</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Maximum number of classes a student can book on a
                            single day.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            className="w-20"
                            value={settings.maxBookingsPerDay ?? 1}
                            onChange={(e) =>
                              setSettings((s) =>
                                s
                                  ? {
                                      ...s,
                                      maxBookingsPerDay: Number(e.target.value),
                                    }
                                  : s,
                              )
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              patchSettings({
                                maxBookingsPerDay: settings.maxBookingsPerDay,
                              })
                            }
                            disabled={savingSettings}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Multi-student slots */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          Allow Multiple Students Per Slot
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, multiple students can book the same time
                          slot.
                        </p>
                      </div>
                      <Switch
                        checked={settings.allowMultipleStudentsPerSlot}
                        onCheckedChange={(checked) => {
                          setSettings((s) =>
                            s
                              ? { ...s, allowMultipleStudentsPerSlot: checked }
                              : s,
                          );
                          patchSettings({
                            allowMultipleStudentsPerSlot: checked,
                            studentsPerSlot: settings.studentsPerSlot,
                          });
                        }}
                      />
                    </div>

                    {settings.allowMultipleStudentsPerSlot && (
                      <div className="flex items-center gap-4 pl-4 border-l-2 border-primary/20">
                        <div>
                          <Label>Max Students Per Slot</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Slot becomes "booked" when this many students have
                            registered.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            className="w-20"
                            value={settings.studentsPerSlot}
                            onChange={(e) =>
                              setSettings((s) =>
                                s
                                  ? {
                                      ...s,
                                      studentsPerSlot: Number(e.target.value),
                                    }
                                  : s,
                              )
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              patchSettings({
                                studentsPerSlot: settings.studentsPerSlot,
                              })
                            }
                            disabled={savingSettings}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Drop Booking Hours */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">
                        Drop Booking Restriction
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Minimum hours before class start that a student may
                        cancel a booking. Set to <strong>0</strong> to allow
                        cancellation at any time.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={48}
                          className="w-24"
                          value={settings.dropBookingHours ?? 0}
                          onChange={(e) =>
                            setSettings((s) =>
                              s
                                ? {
                                    ...s,
                                    dropBookingHours: Number(e.target.value),
                                  }
                                : s,
                            )
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          hour(s) before class
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          patchSettings({
                            dropBookingHours: settings.dropBookingHours ?? 0,
                          })
                        }
                        disabled={savingSettings}
                      >
                        Save
                      </Button>
                    </div>
                    {(settings.dropBookingHours ?? 0) > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                        ⚠ Students cannot cancel a booking within{" "}
                        <strong>{settings.dropBookingHours} hour(s)</strong> of
                        the class start time.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Default Slots ────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Default Time Slots
                  </CardTitle>
                  <CardDescription>
                    Time slots assigned to instructors who haven't been given
                    custom slots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {settings.defaultSlots.map((slot) => (
                      <Badge
                        key={slot}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        {slot}
                        <button
                          onClick={() => {
                            const updated = settings.defaultSlots.filter(
                              (s) => s !== slot,
                            );
                            setSettings((s) =>
                              s ? { ...s, defaultSlots: updated } : s,
                            );
                            patchSettings({ defaultSlots: updated });
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="w-36"
                      placeholder="HH:MM"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newSlotTime) return;
                        if (settings.defaultSlots.includes(newSlotTime)) {
                          toast({
                            title: "Duplicate",
                            description: "Slot already exists",
                            variant: "destructive",
                          });
                          return;
                        }
                        const updated = [
                          ...settings.defaultSlots,
                          newSlotTime,
                        ].sort();
                        setSettings((s) =>
                          s ? { ...s, defaultSlots: updated } : s,
                        );
                        patchSettings({ defaultSlots: updated });
                        setNewSlotTime("");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Slot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Blocked Slots ────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <BanIcon className="h-5 w-5" />
                    Blocked Time Slots
                  </CardTitle>
                  <CardDescription>
                    Block specific date/time ranges. Students cannot book during
                    these periods. Sundays are blocked by default (use Unblocked
                    Sundays below to allow exceptions).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing blocked slots */}
                  {settings.blockedSlots.length > 0 ? (
                    <div className="space-y-2">
                      {settings.blockedSlots.map((slot) => (
                        <div
                          key={slot._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              {slot.date}
                            </Badge>
                            <span className="text-sm">
                              {slot.from} – {slot.to}
                            </span>
                            {slot.reason && (
                              <span className="text-xs text-muted-foreground">
                                {slot.reason}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              settingsApiDelete(`/blocked-slots/${slot._id}`)
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No custom blocked slots.
                    </p>
                  )}

                  {/* Add new */}
                  <div className="grid gap-3 p-4 border rounded-lg bg-muted/20">
                    <p className="text-sm font-medium">Add Blocked Slot</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={newBlockDate}
                          onChange={(e) => setNewBlockDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">From</Label>
                        <Input
                          type="time"
                          value={newBlockFrom}
                          onChange={(e) => setNewBlockFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Input
                          type="time"
                          value={newBlockTo}
                          onChange={(e) => setNewBlockTo(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reason (optional)</Label>
                        <Input
                          value={newBlockReason}
                          onChange={(e) => setNewBlockReason(e.target.value)}
                          placeholder="e.g. Public holiday"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-fit"
                      onClick={() => {
                        if (!newBlockDate || !newBlockFrom || !newBlockTo) {
                          toast({
                            title: "Missing fields",
                            description: "Date, from, and to are required",
                            variant: "destructive",
                          });
                          return;
                        }
                        settingsApiPost("/blocked-slots", {
                          date: newBlockDate,
                          from: newBlockFrom,
                          to: newBlockTo,
                          reason: newBlockReason,
                        });
                        setNewBlockDate("");
                        setNewBlockFrom("09:00");
                        setNewBlockTo("13:00");
                        setNewBlockReason("");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Blocked Slot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Unblocked Sundays ────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="font-display flex items-center gap-2">
                        <SunIcon className="h-5 w-5" />
                        Unblocked Sundays
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Sundays are blocked for bookings by default. Add
                        specific Sundays here to allow bookings on those days.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/40 text-primary hover:bg-primary/5 whitespace-nowrap"
                      onClick={handleUnblockAllSundays}
                      disabled={unblockingAll}
                    >
                      {unblockingAll ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Unblocking...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <SunIcon className="h-4 w-4" />
                          Unblock All Sundays
                        </span>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.unblockedSundays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {settings.unblockedSundays.map((date) => (
                        <Badge
                          key={date}
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          <SunIcon className="h-3 w-3 mr-1" />
                          {date}
                          <button
                            onClick={() =>
                              settingsApiDelete(`/unblocked-sundays/${date}`)
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No Sundays are currently unblocked.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={newSundayDate}
                      onChange={(e) => setNewSundayDate(e.target.value)}
                      className="w-44"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newSundayDate) return;
                        const d = new Date(newSundayDate + "T00:00:00");
                        if (d.getDay() !== 0) {
                          toast({
                            title: "Not a Sunday",
                            description: "Please select a Sunday date",
                            variant: "destructive",
                          });
                          return;
                        }
                        settingsApiPost("/unblocked-sundays", {
                          date: newSundayDate,
                        });
                        setNewSundayDate("");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Unblock Sunday
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Notifications ────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Active notifications appear as banners at the top of every
                    page for all users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.notifications.length > 0 ? (
                    <div className="space-y-2">
                      {settings.notifications.map((notif) => {
                        const cfg = notifTypeConfig[notif.type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={notif._id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              notif.active
                                ? "bg-muted/30"
                                : "opacity-50 bg-muted/10",
                            )}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Icon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  cfg.color,
                                )}
                              />
                              <span className="text-sm flex-1">
                                {notif.message}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {cfg.label}
                              </Badge>
                              <Badge
                                variant={notif.active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {notif.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditNotif(notif)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  settingsApiDelete(
                                    `/notifications/${notif._id}`,
                                  )
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No notifications configured.
                    </p>
                  )}

                  {/* Add notification */}
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                    <p className="text-sm font-medium">Add Notification</p>
                    <div className="flex gap-2">
                      <Select
                        value={newNotifType}
                        onValueChange={(v) =>
                          setNewNotifType(
                            v as "info" | "warning" | "success" | "error",
                          )
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Notification message..."
                        value={newNotifMsg}
                        onChange={(e) => setNewNotifMsg(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Event Date (optional)</Label>
                        <Input
                          type="date"
                          value={newNotifDate}
                          onChange={(e) => setNewNotifDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Venue (optional)</Label>
                        <Input
                          placeholder="e.g. Main Hall"
                          value={newNotifVenue}
                          onChange={(e) => setNewNotifVenue(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Expires On (optional)</Label>
                        <Input
                          type="date"
                          value={newNotifExpiry}
                          onChange={(e) => setNewNotifExpiry(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newNotifMsg.trim()) return;
                        settingsApiPost("/notifications", {
                          message: newNotifMsg,
                          type: newNotifType,
                          date: newNotifDate || null,
                          venue: newNotifVenue || null,
                          expiryDate: newNotifExpiry || null,
                        });
                        setNewNotifMsg("");
                        setNewNotifDate("");
                        setNewNotifVenue("");
                        setNewNotifExpiry("");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Notification
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Registration Codes ───────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Registration Codes
                  </CardTitle>
                  <CardDescription>
                    Create, edit and manage registration codes. Set expiration
                    dates to limit code validity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ── Create New Code ── */}
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Create New Registration Code
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Code</Label>
                        <Input
                          placeholder="e.g. NOOB2026"
                          value={newCodeForm.code}
                          onChange={(e) =>
                            setNewCodeForm((f) => ({
                              ...f,
                              code: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={newCodeForm.category}
                          onValueChange={(v) =>
                            setNewCodeForm((f) => ({
                              ...f,
                              category: v as "noob" | "ultimate",
                              maxClasses:
                                v === "noob"
                                  ? f.maxClasses || "7"
                                  : f.maxClasses,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noob">Noob</SelectItem>
                            <SelectItem value="ultimate">Ultimate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Classes</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder={
                            newCodeForm.category === "noob" ? "7" : "Unlimited"
                          }
                          value={newCodeForm.maxClasses}
                          onChange={(e) =>
                            setNewCodeForm((f) => ({
                              ...f,
                              maxClasses: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Expiration Date{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={newCodeForm.expirationDate}
                          onChange={(e) =>
                            setNewCodeForm((f) => ({
                              ...f,
                              expirationDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCreateCode}
                      disabled={
                        creatingCode ||
                        !newCodeForm.code.trim() ||
                        !newCodeForm.expirationDate
                      }
                      className="w-fit"
                    >
                      {creatingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Create Code
                    </Button>
                  </div>

                  {/* ── Existing Codes ── */}
                  {loadingCodes ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {codes.map((c) => {
                        const isExpired =
                          c.expirationDate &&
                          new Date() > new Date(c.expirationDate);
                        return (
                          <div
                            key={c._id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isExpired && "opacity-50",
                            )}
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge
                                variant="outline"
                                className="font-mono text-sm"
                              >
                                {c.code}
                              </Badge>
                              <Badge
                                variant={
                                  c.category === "ultimate"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {c.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Max classes: {c.maxClasses ?? "Unlimited"}
                              </span>
                              {c.expirationDate && (
                                <span
                                  className={cn(
                                    "text-xs",
                                    isExpired
                                      ? "text-destructive"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {isExpired ? "Expired" : "Expires"}:{" "}
                                  {new Date(
                                    c.expirationDate,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              {c.used && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-muted-foreground"
                                >
                                  Used
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCode(c)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {codes.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No registration codes found. Create one above.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Admin Signature ──────────────────────────────────── */}
              <SignaturePadCard />
            </>
          ) : null}
        </>
      )}

      {/* ── Edit Notification Dialog ────────────────────────────────── */}
      <Dialog open={!!editNotif} onOpenChange={(o) => !o && setEditNotif(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notification</DialogTitle>
          </DialogHeader>
          {editNotif && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editNotif.type}
                  onValueChange={(v) =>
                    setEditNotif((n) =>
                      n
                        ? {
                            ...n,
                            type: v as "info" | "warning" | "success" | "error",
                          }
                        : n,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  value={editNotif.message}
                  onChange={(e) =>
                    setEditNotif((n) =>
                      n ? { ...n, message: e.target.value } : n,
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Event Date (optional)</Label>
                  <Input
                    type="date"
                    value={editNotif.date || ""}
                    onChange={(e) =>
                      setEditNotif((n) =>
                        n ? { ...n, date: e.target.value || null } : n,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Venue (optional)</Label>
                  <Input
                    placeholder="e.g. Main Hall"
                    value={editNotif.venue || ""}
                    onChange={(e) =>
                      setEditNotif((n) =>
                        n ? { ...n, venue: e.target.value || null } : n,
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expires On (optional)</Label>
                <Input
                  type="date"
                  value={
                    editNotif.expiryDate
                      ? editNotif.expiryDate.split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditNotif((n) =>
                      n ? { ...n, expiryDate: e.target.value || null } : n,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Notification auto-hides after this date.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editNotif.active}
                  onCheckedChange={(v) =>
                    setEditNotif((n) => (n ? { ...n, active: v } : n))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNotif(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editNotif) return;
                settingsApiPut(`/notifications/${editNotif._id}`, {
                  message: editNotif.message,
                  type: editNotif.type,
                  active: editNotif.active,
                  date: editNotif.date || null,
                  venue: editNotif.venue || null,
                  expiryDate: editNotif.expiryDate || null,
                });
                setEditNotif(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Code Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!editCodeDialog}
        onOpenChange={(o) => !o && setEditCodeDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Registration Code</DialogTitle>
            <DialogDescription>
              Update the code value, category, or expiration date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={editCodeForm.code}
                onChange={(e) =>
                  setEditCodeForm((f) => ({ ...f, code: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editCodeForm.category}
                onValueChange={(v) =>
                  setEditCodeForm((f) => ({
                    ...f,
                    category: v as "noob" | "ultimate",
                    maxClasses: v === "noob" ? f.maxClasses || "7" : f.maxClasses,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="noob">Noob</SelectItem>
                  <SelectItem value="ultimate">Ultimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Classes</Label>
              <Input
                type="number"
                min="1"
                placeholder={editCodeForm.category === "noob" ? "7" : "Unlimited"}
                value={editCodeForm.maxClasses}
                onChange={(e) =>
                  setEditCodeForm((f) => ({
                    ...f,
                    maxClasses: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for unlimited ultimate codes. Noob codes default to 7 if left empty.
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Expiration Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={editCodeForm.expirationDate}
                onChange={(e) =>
                  setEditCodeForm((f) => ({
                    ...f,
                    expirationDate: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                All codes must have an expiration date.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCodeDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCode}
              disabled={!editCodeForm.expirationDate}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
