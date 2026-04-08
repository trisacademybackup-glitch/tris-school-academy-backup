import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { SERVER_URL } from "@/lib/server";
import { User, UserRole } from "@/lib/types";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Eye,
  EyeOff,
  Loader,
  UserCheck,
  UserX,
  RefreshCw,
  Calendar,
  RotateCcw,
  Award,
  Download,
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  downloadCertificate,
  downloadCertificatesBulk,
} from "@/lib/certificate";
import * as XLSX from "xlsx";

interface ExtendedUser extends User {
  isActive?: boolean;
  periodExpires?: string | null;
  bookingsStartedOn?: string | null;
  createdAt?: string | null;
  classCount?: number;
  maxClassesOverride?: number | null;
  effectiveClassLimit?: number | null;
}

type ClassFilter = "all" | "lt7" | "eq7" | "gte7";
type SortField = "name" | "createdAt" | "classCount";
type SortDir = "asc" | "desc";

const CLASS_COMPLETION = 7;

function isPeriodExpired(u: ExtendedUser): boolean {
  if (!u.bookingsStartedOn) return false;
  const start = new Date(u.bookingsStartedOn);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return end < new Date();
}

const UsersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [codes, setCodes] = useState<
    Array<{
      _id: string;
      code: string;
      category: string;
      expirationDate?: string;
      maxClasses?: number | null;
    }>
  >([]);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState("noob");
  const [newExpiry, setNewExpiry] = useState("");
  const [newMaxClasses, setNewMaxClasses] = useState("7");
  const [codeLoading, setCodeLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<ExtendedUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student" as UserRole,
    category: "noob",
    code: "",
    isActive: true,
    periodExpires: "",
    bookingsStartedOn: "",
    maxClassesOverride: "",
  });
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetingPeriod, setResetingPeriod] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) return;
    fetch(`${SERVER_URL}/admin/codes`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCodes(data.data);
      });
  }, [codeDialogOpen, user]);

  const fetchUsers = React.useCallback(() => {
    setLoading(true);
    let url = `${SERVER_URL}/admin/users?limit=1000`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data as ExtendedUser[]);
        } else {
          setUsers([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setLoading(false);
      });
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, dialogOpen]);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (classFilter !== "all") {
      list = list.filter((u) => {
        if (u.role !== "student") return true;
        const cc = u.classCount ?? 0;
        if (classFilter === "lt7") return cc < CLASS_COMPLETION;
        if (classFilter === "eq7") return cc === CLASS_COMPLETION;
        if (classFilter === "gte7") return cc >= CLASS_COMPLETION;
        return true;
      });
    }
    list.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;
      if (sortField === "classCount") {
        valA = a.classCount ?? -1;
        valB = b.classCount ?? -1;
      } else if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else {
        valA = new Date(a.createdAt ?? 0).getTime();
        valB = new Date(b.createdAt ?? 0).getTime();
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, roleFilter, classFilter, sortField, sortDir]);

  const eligibleStudents = useMemo(
    () =>
      filteredUsers.filter(
        (u) => u.role === "student" && (u.classCount ?? 0) >= CLASS_COMPLETION,
      ),
    [filteredUsers],
  );

  if (!user || (user.role !== "admin" && user.role !== "manager")) return null;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />
    );
  };

  const handleSaveCode = () => {
    if (!newCode || !newExpiry) {
      toast({
        title: "Error",
        description: "Code and expiry date required.",
        variant: "destructive",
      });
      return;
    }

    setCodeLoading(true);
    fetch(
      editingCodeId
        ? `${SERVER_URL}/admin/codes/${editingCodeId}`
        : `${SERVER_URL}/admin/add-code`,
      {
        method: editingCodeId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          code: newCode,
          category: newCategory,
          expirationDate: newExpiry,
          maxClasses:
            newCategory === "ultimate" && !newMaxClasses
              ? null
              : newMaxClasses,
        }),
      },
    )
      .then((r) => r.json())
      .then((data) => {
        setCodeLoading(false);
        if (data.success) {
          toast({ title: editingCodeId ? "Code Updated" : "Code Created" });
          setEditingCodeId(null);
          setNewCode("");
          setNewCategory("noob");
          setNewExpiry("");
          setNewMaxClasses("7");
          setCodes((prev) => {
            const nextCode = data.data;
            if (editingCodeId) {
              return prev.map((item) =>
                item._id === editingCodeId ? nextCode : item,
              );
            }
            return [nextCode, ...prev];
          });
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      })
      .catch(() => setCodeLoading(false));
  };

  const startEditCode = (codeItem: {
    _id: string;
    code: string;
    category: string;
    expirationDate?: string;
    maxClasses?: number | null;
  }) => {
    setEditingCodeId(codeItem._id);
    setNewCode(codeItem.code);
    setNewCategory(codeItem.category);
    setNewExpiry(
      codeItem.expirationDate
        ? new Date(codeItem.expirationDate).toISOString().slice(0, 10)
        : "",
    );
    setNewMaxClasses(
      codeItem.maxClasses !== null && codeItem.maxClasses !== undefined
        ? String(codeItem.maxClasses)
        : codeItem.category === "noob"
          ? "7"
          : "",
    );
  };

  const resetCodeForm = () => {
    setEditingCodeId(null);
    setNewCode("");
    setNewCategory("noob");
    setNewExpiry("");
    setNewMaxClasses("7");
  };

  const handleDeleteCode = (id: string) => {
    fetch(`${SERVER_URL}/admin/codes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          toast({ title: "Code Deleted" });
          setCodes((p) => p.filter((c) => c._id !== id));
        }
      });
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "student",
      category: "noob",
      code: "",
      isActive: true,
      periodExpires: "",
      bookingsStartedOn: "",
      maxClassesOverride: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (u: ExtendedUser) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      password: "",
      role: u.role,
      category: u.category || "noob",
      code: u.code || "",
      isActive: u.isActive ?? true,
      periodExpires: u.periodExpires
        ? new Date(u.periodExpires).toISOString().slice(0, 10)
        : "",
      bookingsStartedOn: u.bookingsStartedOn
        ? new Date(u.bookingsStartedOn).toISOString().slice(0, 10)
        : "",
      maxClassesOverride:
        u.maxClassesOverride !== null && u.maxClassesOverride !== undefined
          ? String(u.maxClassesOverride)
          : "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast({
        title: "Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      category: form.category,
      code: form.code,
      isActive: form.isActive,
      periodExpires: form.periodExpires || null,
      bookingsStartedOn: form.bookingsStartedOn || null,
      maxClassesOverride: form.maxClassesOverride
        ? Number(form.maxClassesOverride)
        : null,
    };
    if (form.password) body.password = form.password;
    const url = editUser
      ? `${SERVER_URL}/admin/update-user/${editUser._id}`
      : `${SERVER_URL}/admin/add-user`;
    fetch(url, {
      method: editUser ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        setSaving(false);
        if (data.success) {
          toast({
            title: editUser ? "Updated" : "Created",
            description: `User ${editUser ? "updated" : "created"} successfully.`,
          });
          setDialogOpen(false);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed.",
            variant: "destructive",
          });
        }
      })
      .catch(() => setSaving(false));
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setDeleting(true);
    fetch(`${SERVER_URL}/admin/users/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setDeleting(false);
        setDeleteId(null);
        if (data.success) {
          toast({ title: "Deleted" });
          fetchUsers();
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        setDeleting(false);
        setDeleteId(null);
      });
  };

  const toggleActive = (u: ExtendedUser) => {
    fetch(`${SERVER_URL}/admin/users/${u._id}/toggle-active`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUsers((p) =>
            p.map((usr) =>
              usr._id === u._id ? { ...usr, isActive: data.isActive } : usr,
            ),
          );
          toast({
            title: data.isActive ? "Activated" : "Deactivated",
            description: `${u.name} is now ${data.isActive ? "active" : "inactive"}.`,
          });
        }
      });
  };

  const resetBookingPeriod = (u: ExtendedUser) => {
    setResetingPeriod(u._id!);
    fetch(`${SERVER_URL}/admin/users/${u._id}/reset-booking-period`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setResetingPeriod(null);
        if (data.success) {
          toast({
            title: "Period Reset",
            description: `${u.name}'s 30-day booking period has been reset.`,
          });
          fetchUsers();
        }
      })
      .catch(() => setResetingPeriod(null));
  };

  const handleDownloadCert = async (u: ExtendedUser) => {
    try {
      await downloadCertificate({ studentName: u.name });
      toast({ title: "Certificate downloaded", description: u.name });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate certificate.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = async () => {
    if (eligibleStudents.length === 0) {
      toast({
        title: "No eligible students",
        description:
          "No students with 7+ classes in the current filtered list.",
        variant: "destructive",
      });
      return;
    }
    setBulkDownloading(true);
    setBulkProgress({ done: 0, total: eligibleStudents.length });
    try {
      await downloadCertificatesBulk(
        eligibleStudents.map((u) => ({ studentName: u.name })),
        (done, total) => setBulkProgress({ done, total }),
      );
      toast({
        title: "Done",
        description: `Downloaded ${eligibleStudents.length} certificate(s).`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Some certificates failed.",
        variant: "destructive",
      });
    } finally {
      setBulkDownloading(false);
      setBulkProgress(null);
    }
  };

  // Helper to convert user array to Excel sheet data
  const mapUsersToExcelData = (usersToExport: ExtendedUser[]) => {
    return usersToExport.map((u) => ({
      Name: u.name,
      Email: u.email,
      Phone: u.phone || "—",
      Role: u.role,
      Category: u.category || "—",
      Code: u.code || "—",
      "Classes Completed": u.classCount ?? 0,
      "Joined Date": u.createdAt
        ? new Date(u.createdAt).toLocaleDateString()
        : "—",
      "Active Status": u.isActive !== false ? "Active" : "Inactive",
      "Period Expires": u.periodExpires
        ? new Date(u.periodExpires).toLocaleDateString()
        : "—",
      "Bookings Started On": u.bookingsStartedOn
        ? new Date(u.bookingsStartedOn).toLocaleDateString()
        : "—",
      "Assigned Max Classes": u.maxClassesOverride ?? "-",
      "Effective Booking Limit": u.effectiveClassLimit ?? "Unlimited",
      "30-day Period Expired": isPeriodExpired(u) ? "Yes" : "No",
    }));
  };

  // Export current filtered & sorted users
  const handleExportCurrent = () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No data",
        description: "There are no users to export.",
        variant: "destructive",
      });
      return;
    }
    setExportLoading(true);
    try {
      const sheetData = mapUsersToExcelData(filteredUsers);
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users (Current View)");
      XLSX.writeFile(
        wb,
        `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast({
        title: "Export completed",
        description: `${filteredUsers.length} users exported.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Could not generate Excel file.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Export all users (no filters)
  const handleExportAll = async () => {
    setExportLoading(true);
    try {
      // Fetch all users without search param
      const res = await fetch(`${SERVER_URL}/admin/users?limit=10000`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch users");
      const allUsers = data.data as ExtendedUser[];
      const sheetData = mapUsersToExcelData(allUsers);
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "All Users");
      XLSX.writeFile(
        wb,
        `all_users_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast({
        title: "Export completed",
        description: `${allUsers.length} users exported.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Could not fetch all users or generate file.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-destructive/15 text-destructive",
    manager: "bg-primary/15 text-primary",
    instructor: "bg-accent/20 text-accent-foreground",
    student: "bg-green-500/15 text-green-700 dark:text-green-400",
  };

  const classCountColor = (count: number) => {
    if (count >= CLASS_COMPLETION) return "text-emerald-600 font-semibold";
    if (count >= 4) return "text-amber-500 font-medium";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Code dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input
                placeholder="e.g. DRIVER2024"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={newCategory}
                onValueChange={(value) => {
                  setNewCategory(value);
                  setNewMaxClasses((current) => {
                    if (value === "noob") return current || "7";
                    if (editingCodeId && current) return current;
                    return "";
                  });
                }}
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
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Classes</Label>
              <p className="text-xs text-muted-foreground">
                {newCategory === "noob"
                  ? "Default noob limit is 7. Change it if this code should allow a different number of classes."
                  : "Leave blank for unlimited, or enter a number to cap students who use this code."}
              </p>
              <Input
                type="number"
                min="1"
                placeholder={newCategory === "noob" ? "7" : "Unlimited"}
                value={newMaxClasses}
                onChange={(e) => setNewMaxClasses(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveCode}
              disabled={codeLoading}
              className="w-full bg-primary text-primary-foreground"
            >
              {codeLoading ? "Creating…" : "Create Code"}
            </Button>
            {editingCodeId && (
              <Button variant="outline" className="w-full" onClick={resetCodeForm}>
                Cancel Edit
              </Button>
            )}
            {codes.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">
                  Existing Codes
                </p>
                {codes.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between text-sm rounded-lg border px-3 py-2"
                  >
                    <div>
                      <span className="font-mono font-medium">{c.code}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {c.category}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.maxClasses ? `${c.maxClasses} classes` : "Unlimited"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEditCode(c)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteCode(c._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1">Manage all system users</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCodeDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Codes
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {/* Export buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCurrent}
            disabled={exportLoading || filteredUsers.length === 0}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            {exportLoading ? (
              <Loader className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export current
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={exportLoading}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            {exportLoading ? (
              <Loader className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export all
          </Button>

          {/* Bulk certificate download */}
          {eligibleStudents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              title={`Download certificates for ${eligibleStudents.length} eligible student(s) in current view`}
            >
              {bulkDownloading ? (
                <>
                  <Loader className="animate-spin w-4 h-4 mr-2" />
                  {bulkProgress
                    ? `${bulkProgress.done}/${bulkProgress.total}`
                    : "…"}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Certificates ({eligibleStudents.length})
                </>
              )}
            </Button>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openCreate}
                className="bg-accent text-white hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editUser ? "Edit User" : "Create User"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password {editUser && "(leave blank to keep)"}</Label>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v: UserRole) =>
                        setForm((f) => ({ ...f, role: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v }))
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
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                  />
                </div>
                {(form.role === "student" || editUser?.role === "student") && (
                  <div className="space-y-1.5">
                    <Label>Max Classes Override</Label>
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use the registration code limit. Set a number here to give this student a custom booking cap.
                    </p>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Use code default"
                      value={form.maxClassesOverride}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          maxClassesOverride: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Account Active</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive users can't log in or appear on booking
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contract / Period Expires</Label>
                  <p className="text-xs text-muted-foreground">
                    Instructor won't appear on booking page after this date.
                    Leave blank for no expiry.
                  </p>
                  <Input
                    type="date"
                    value={form.periodExpires}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodExpires: e.target.value }))
                    }
                  />
                </div>
                {(form.role === "student" || editUser?.role === "student") && (
                  <div className="space-y-1.5">
                    <Label>Bookings Started On</Label>
                    <p className="text-xs text-muted-foreground">
                      Date the 30-day booking period started. Clear to reset.
                    </p>
                    <Input
                      type="date"
                      value={form.bookingsStartedOn}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bookingsStartedOn: e.target.value,
                        }))
                      }
                    />
                    {form.bookingsStartedOn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() =>
                          setForm((f) => ({ ...f, bookingsStartedOn: "" }))
                        }
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Clear to reset period
                      </Button>
                    )}
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader className="animate-spin w-4 h-4" />
                      Saving…
                    </span>
                  ) : editUser ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 30-day period info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">30-day Booking Period:</span> When a
          noob student's 30-day window expires they are{" "}
          <span className="font-semibold">automatically blocked</span> from
          booking any further classes. Use the{" "}
          <RotateCcw className="inline w-3 h-3 mx-0.5" /> reset button to
          re-open their period.
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="instructor">Instructors</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={classFilter}
          onValueChange={(v) => setClassFilter(v as ClassFilter)}
        >
          <SelectTrigger className="w-[175px]">
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="lt7">Under 7 classes</SelectItem>
            <SelectItem value="eq7">Exactly 7 classes</SelectItem>
            <SelectItem value="gte7">7+ classes (eligible)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center text-xs text-muted-foreground self-center whitespace-nowrap">
          {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
          {eligibleStudents.length > 0 && (
            <span className="ml-2 text-emerald-600 font-medium">
              · {eligibleStudents.length} cert-eligible
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6">
                <Loader className="animate-spin w-5 h-5" />
                Loading…
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No users found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="text-left p-4 font-medium">
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => toggleSort("name")}
                      >
                        Name <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Phone
                    </th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Code
                    </th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => toggleSort("classCount")}
                      >
                        Classes <SortIcon field="classCount" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium hidden xl:table-cell">
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Joined <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const periodExpired = isPeriodExpired(u);
                    const classCount = u.classCount ?? 0;
                    const certEligible =
                      u.role === "student" && classCount >= CLASS_COMPLETION;
                    return (
                      <tr
                        key={u._id}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/30 transition-colors",
                          u.isActive === false && "opacity-60",
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-medium flex-shrink-0",
                                certEligible
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-primary/10",
                              )}
                            >
                              {certEligible ? (
                                <Award className="w-4 h-4" />
                              ) : (
                                u.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {u.category}
                                {u.effectiveClassLimit
                                  ? ` • max ${u.effectiveClassLimit}`
                                  : " • unlimited"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">
                          {u.email}
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                          {u.phone || "—"}
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell font-mono text-xs">
                          {u.code}
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                              roleColors[u.role],
                            )}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          {u.role === "student" ? (
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className={classCountColor(classCount)}>
                                {classCount}
                                {u.effectiveClassLimit
                                  ? ` / ${u.effectiveClassLimit}`
                                  : ""}
                              </span>
                              {certEligible && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                                  ✓ Cert
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden xl:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "—"}
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <div className="flex flex-col gap-0.5">
                            {u.isActive !== false ? (
                              <span className="text-xs flex items-center gap-1 text-green-600">
                                <UserCheck className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="text-xs flex items-center gap-1 text-red-500">
                                <UserX className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                            {u.role === "student" && u.bookingsStartedOn && (
                              <span
                                className={cn(
                                  "text-xs flex items-center gap-1",
                                  periodExpired
                                    ? "text-red-500 font-medium"
                                    : "text-muted-foreground",
                                )}
                                title={
                                  periodExpired
                                    ? "30-day period expired — reset to allow booking"
                                    : "30-day booking period active"
                                }
                              >
                                <Clock className="w-3 h-3" />
                                {periodExpired ? "Period expired" : "In period"}
                              </span>
                            )}
                            {u.role === "student" && (
                              <span className="text-xs text-muted-foreground">
                                Limit:{" "}
                                {u.effectiveClassLimit ?? "Unlimited"}
                                {u.maxClassesOverride
                                  ? " (user override)"
                                  : ""}
                              </span>
                            )}
                            {u.periodExpires && (
                              <span
                                className={cn(
                                  "text-xs",
                                  new Date(u.periodExpires) < new Date()
                                    ? "text-red-500"
                                    : "text-muted-foreground",
                                )}
                              >
                                Exp:{" "}
                                {new Date(u.periodExpires).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="User actions">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                {certEligible && (
                                  <DropdownMenuItem onClick={() => handleDownloadCert(u)}>
                                    <Award className="w-4 h-4 mr-2 text-emerald-600" />
                                    Download certificate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => toggleActive(u)}>
                                  {u.isActive !== false ? (
                                    <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                                  ) : (
                                    <UserX className="w-4 h-4 mr-2 text-red-500" />
                                  )}
                                  {u.isActive !== false ? "Deactivate user" : "Activate user"}
                                </DropdownMenuItem>
                                {u.role === "student" && (
                                  <DropdownMenuItem
                                    disabled={resetingPeriod === u._id}
                                    onClick={() => resetBookingPeriod(u)}
                                  >
                                    {resetingPeriod === u._id ? (
                                      <Loader className="animate-spin w-4 h-4 mr-2" />
                                    ) : (
                                      <RotateCcw
                                        className={cn(
                                          "w-4 h-4 mr-2",
                                          periodExpired ? "text-red-500" : "text-amber-500",
                                        )}
                                      />
                                    )}
                                    Reset booking period
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openEdit(u)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit user
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(u._id!)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete user
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <Dialog
              open={!!deleteId}
              onOpenChange={(open) => {
                if (!open) setDeleteId(null);
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Delete</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                  Are you sure you want to delete this user?
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteId(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <span className="flex items-center gap-2">
                        <Loader className="animate-spin w-4 h-4" />
                        Deleting…
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
