import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SERVER_URL } from "@/lib/server";
import {
  Edit,
  Search,
  Loader,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Instructor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  category: string;
  code: string;
  isActive: boolean;
  periodExpires?: string | null;
  bookingsStartedOn?: string | null;
  slots?: string[];
  createdAt: string;
}

const ALL_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const AdminInstructorsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    code: "",
    category: "noob",
    isActive: true,
    periodExpires: "",
    slots: [] as string[],
  });

  const token = () => localStorage.getItem("token");

  const fetchInstructors = () => {
    setLoading(true);
    fetch(
      `${SERVER_URL}/admin/users?limit=500${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      { headers: { Authorization: `Bearer ${token()}` } },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInstructors(
            data.data.filter((u: Instructor) => u.role === "instructor"),
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openEdit = (inst: Instructor) => {
    setEditInstructor(inst);
    setForm({
      name: inst.name,
      email: inst.email,
      phone: inst.phone || "",
      password: "",
      code: inst.code,
      category: inst.category || "noob",
      isActive: inst.isActive ?? true,
      periodExpires: inst.periodExpires
        ? new Date(inst.periodExpires).toISOString().slice(0, 10)
        : "",
      slots: inst.slots ?? ALL_SLOTS,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editInstructor) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      code: form.code,
      category: form.category,
      isActive: form.isActive,
      periodExpires: form.periodExpires || null,
      slots: form.slots,
    };
    if (form.password) body.password = form.password;

    try {
      const res = await fetch(
        `${SERVER_URL}/admin/update-user/${editInstructor._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Updated",
          description: "Instructor updated successfully.",
        });
        setDialogOpen(false);
        fetchInstructors();
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
        description: "Request failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (inst: Instructor) => {
    try {
      const res = await fetch(
        `${SERVER_URL}/admin/users/${inst._id}/toggle-active`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token()}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setInstructors((prev) =>
          prev.map((i) =>
            i._id === inst._id ? { ...i, isActive: data.isActive } : i,
          ),
        );
        toast({
          title: data.isActive ? "Activated" : "Deactivated",
          description: `${inst.name} is now ${data.isActive ? "active" : "inactive"}.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Toggle failed.",
        variant: "destructive",
      });
    }
  };

  const toggleSlot = (slot: string) => {
    setForm((f) => ({
      ...f,
      slots: f.slots.includes(slot)
        ? f.slots.filter((s) => s !== slot)
        : [...f.slots, slot].sort(),
    }));
  };

  const isExpired = (inst: Instructor) => {
    if (!inst.periodExpires) return false;
    return new Date(inst.periodExpires) < new Date();
  };

  const expiresLabel = (inst: Instructor) => {
    if (!inst.periodExpires) return "No expiry";
    const d = new Date(inst.periodExpires);
    const expired = d < new Date();
    return `${expired ? "Expired" : "Expires"}: ${d.toLocaleDateString()}`;
  };

  const filtered = instructors.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.code?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Instructors</h1>
          <p className="text-muted-foreground mt-1">
            Manage instructor accounts, slots and contract periods
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInstructors}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search instructors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8">
                <Loader className="animate-spin w-5 h-5" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No instructors found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Phone
                    </th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Code
                    </th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      Period Expires
                    </th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      Slots
                    </th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inst) => (
                    <tr
                      key={inst._id}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/30 transition-colors",
                        !inst.isActive && "opacity-60",
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                            {inst.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{inst.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {inst.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">
                        {inst.email}
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        {inst.phone || "—"}
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        {inst.code}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={inst.isActive}
                            onCheckedChange={() => toggleActive(inst)}
                          />
                          <span className="text-xs">
                            {inst.isActive ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1">
                                <UserX className="w-3 h-3" /> Inactive
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {inst.periodExpires ? (
                          <Badge
                            variant={
                              isExpired(inst) ? "destructive" : "secondary"
                            }
                            className="text-xs gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            {expiresLabel(inst)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No expiry
                          </span>
                        )}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {(inst.slots ?? ALL_SLOTS).length} slots
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(inst)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Instructor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Name */}
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            {/* Email */}
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            {/* Phone */}
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            {/* Code */}
            <div className="space-y-1">
              <Label>Registration Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
              />
            </div>
            {/* Category */}
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
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
            {/* Password */}
            <div className="space-y-1">
              <Label>Password (leave blank to keep)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Account Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive instructors won't appear on the booking page
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
            {/* Period Expires */}
            <div className="space-y-1">
              <Label>Contract Expires (periodExpires)</Label>
              <p className="text-xs text-muted-foreground">
                After this date the instructor won't appear on the booking page.
                Leave blank for permanent staff.
              </p>
              <Input
                type="date"
                value={form.periodExpires}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodExpires: e.target.value }))
                }
              />
              {form.periodExpires && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setForm((f) => ({ ...f, periodExpires: "" }))}
                >
                  Clear expiry date
                </Button>
              )}
            </div>
            {/* Slots */}
            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      form.slots.includes(slot)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader className="animate-spin w-4 h-4" /> Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInstructorsPage;
