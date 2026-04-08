import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SERVER_URL } from "@/lib/server";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  Clock,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AdminSlotManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [slotsMap, setSlotsMap] = useState<Record<string, string[]>>({});
  const [savingInstructor, setSavingInstructor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultSlots, setDefaultSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const fetchData = async () => {
      setInitialLoading(true);
      const token = localStorage.getItem("token");
      try {
        // Fetch settings and instructors in parallel
        const [settingsRes, instructorsRes] = await Promise.all([
          fetch(`${SERVER_URL}/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${SERVER_URL}/instructor/list`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const settingsData = await settingsRes.json();
        const instructorsData = await instructorsRes.json();

        // Set default slots from settings
        const slots: string[] =
          settingsData.success && settingsData.settings?.defaultSlots?.length
            ? [...settingsData.settings.defaultSlots].sort()
            : [
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
              ];
        setDefaultSlots(slots);

        if (instructorsData.success) {
          setInstructors(instructorsData.instructors);
          const map: Record<string, string[]> = {};
          instructorsData.instructors.forEach((inst: User) => {
            map[inst._id || inst.id] = inst.slots || [...slots];
          });
          setSlotsMap(map);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleSlotChange = (instId: string, slot: string, checked: boolean) => {
    setSlotsMap((prev) => {
      const slots = prev[instId] || [];
      return {
        ...prev,
        [instId]: checked
          ? [...slots, slot].sort()
          : slots.filter((s) => s !== slot),
      };
    });
  };

  const handleSelectAll = (instId: string) => {
    setSlotsMap((prev) => ({
      ...prev,
      [instId]: [...defaultSlots],
    }));
  };

  const handleClearAll = (instId: string) => {
    setSlotsMap((prev) => ({
      ...prev,
      [instId]: [],
    }));
  };

  const handleSave = async (instId: string) => {
    setSavingInstructor(instId);
    const token = localStorage.getItem("token");
    const slots = slotsMap[instId];

    try {
      const res = await fetch(`${SERVER_URL}/instructor/${instId}/slots`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slots }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Instructor's slots have been updated.",
          variant: "default",
        });
      } else {
        toast({
          title: "Update failed",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update slots. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setSavingInstructor(null);
    }
  };

  const filteredInstructors = instructors.filter((inst) =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Skeleton key={j} className="h-8 w-20" />
                  ))}
                </div>
                <Skeleton className="h-9 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Instructor Slot Management
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Set available slots for each instructor (Monday - Saturday)
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Instructors
                </p>
                <p className="text-2xl font-bold">{instructors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default Slots</p>
                <p className="text-2xl font-bold">{defaultSlots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10 col-span-2">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Settings2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Slots sourced from Settings
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                  {defaultSlots.join(" · ") || "No default slots configured"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructors Grid */}
      {filteredInstructors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No instructors found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredInstructors.map((inst) => {
            const instId = inst._id || inst.id;
            const currentSlots = slotsMap[instId] || [];
            const isSaving = savingInstructor === instId;

            return (
              <Card
                key={instId}
                className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
              >
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="font-display text-xl flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </span>
                        {inst.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {currentSlots.length} / {defaultSlots.length} slots
                          selected
                        </Badge>
                      </CardDescription>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll(instId)}
                        disabled={isSaving}
                        className="h-8 px-2"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearAll(instId)}
                        disabled={isSaving}
                        className="h-8 px-2"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {defaultSlots.map((slot) => {
                        const isSelected = currentSlots.includes(slot);

                        return (
                          <div
                            key={slot}
                            className={cn(
                              "relative flex items-center space-x-2 rounded-lg border p-3 transition-all",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-input hover:border-primary/50 hover:bg-accent/50",
                            )}
                          >
                            <Checkbox
                              id={`${instId}-${slot}`}
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSlotChange(
                                  instId,
                                  slot,
                                  checked as boolean,
                                )
                              }
                              disabled={isSaving}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                              htmlFor={`${instId}-${slot}`}
                              className="flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {slot}
                            </Label>

                            {isSelected && (
                              <CheckCircle2 className="h-3 w-3 text-primary absolute top-1 right-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {WEEKDAYS.map((day) => (
                        <Badge
                          key={day}
                          variant="outline"
                          className="text-xs bg-muted/50"
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleSave(instId)}
                      disabled={isSaving}
                      size="default"
                      className="min-w-[100px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Slots
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSlotManagement;
