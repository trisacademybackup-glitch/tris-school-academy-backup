import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVER_URL } from "@/lib/server";
import { Badge } from "@/components/ui/badge";

const StarRating = ({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md";
}) => {
  const cls = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            cls,
            value >= s ? "fill-accent text-accent" : "text-muted-foreground/20",
          )}
        />
      ))}
    </div>
  );
};

interface Feedback {
  _id?: string;
  id?: string;
  studentId: string;
  instructorId: string;
  rating?: number;
  comment?: string;
  instructorRating?: number;
  instructorComment?: string;
  gearsRating?: number;
  gearsComment?: string;
  motorcyclesRating?: number;
  motorcyclesComment?: string;
  schedulingRating?: number;
  schedulingComment?: string;
  referralRating?: number;
  createdAt: string;
  studentName?: string;
  instructorName?: string;
  student?: { name?: string; email?: string };
  instructor?: { name?: string };
}

const FeedbackCard = ({ fb }: { fb: Feedback }) => {
  const [expanded, setExpanded] = useState(false);

  const studentName = fb.studentName || fb.student?.name || "Student";
  const instructorName = fb.instructorName || fb.instructor?.name || "General";

  const categories = [
    {
      label: "Instructor",
      rating: fb.instructorRating,
      comment: fb.instructorComment,
    },
    { label: "Gears", rating: fb.gearsRating, comment: fb.gearsComment },
    {
      label: "Motorcycles",
      rating: fb.motorcyclesRating,
      comment: fb.motorcyclesComment,
    },
    {
      label: "Scheduling",
      rating: fb.schedulingRating,
      comment: fb.schedulingComment,
    },
    { label: "Referral Likelihood", rating: fb.referralRating },
  ].filter((c) => c.rating);

  const hasCategories = categories.length > 0;

  // Compute average of all ratings present
  const allRatings = [
    fb.rating,
    fb.instructorRating,
    fb.gearsRating,
    fb.motorcyclesRating,
    fb.schedulingRating,
    fb.referralRating,
  ].filter(Boolean) as number[];
  const avgRating = allRatings.length
    ? Math.round(
        (allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10,
      ) / 10
    : null;

  return (
    <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{studentName}</p>
          <p className="text-xs text-muted-foreground">
            → <span className="text-primary">{instructorName}</span> ·{" "}
            {new Date(fb.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {avgRating !== null && (
            <div className="flex items-center gap-1">
              <StarRating value={Math.round(avgRating)} />
              <span className="text-xs text-muted-foreground">
                ({avgRating})
              </span>
            </div>
          )}
          {hasCategories && (
            <Badge variant="outline" className="text-xs">
              {categories.length} categories
            </Badge>
          )}
        </div>
      </div>

      {fb.comment && (
        <p className="text-sm text-muted-foreground mb-3 bg-muted/30 rounded-lg p-2">
          "{fb.comment}"
        </p>
      )}

      {hasCategories && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {expanded ? "Hide" : "View"} category breakdown
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {categories.map((c) => (
                <div
                  key={c.label}
                  className="flex items-start justify-between text-sm gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-xs">{c.label}</p>
                    {c.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        "{c.comment}"
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StarRating value={c.rating!} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AdminsFeedbackPage = () => {
  const { user } = useAuth();
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchFeedback = React.useCallback(() => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const url =
      user.role === "admin" || user.role === "manager"
        ? `${SERVER_URL}/feedback/all`
        : `${SERVER_URL}/feedback/student/${user.id}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setAllFeedback(
          data.success && Array.isArray(data.feedbacks) ? data.feedbacks : [],
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (!user) return null;

  // Compute aggregate stats
  const allRatings: number[] = [];
  allFeedback.forEach((fb) => {
    [
      fb.rating,
      fb.instructorRating,
      fb.gearsRating,
      fb.motorcyclesRating,
      fb.schedulingRating,
      fb.referralRating,
    ]
      .filter(Boolean)
      .forEach((r) => allRatings.push(r!));
  });
  const overallAvg = allRatings.length
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  const categoryAvg = (key: keyof Feedback) => {
    const vals = allFeedback.map((fb) => fb[key] as number).filter(Boolean);
    return vals.length
      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : null;
  };

  // Filter
  const filtered = allFeedback.filter((fb) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const studentName = (
      fb.studentName ||
      fb.student?.name ||
      ""
    ).toLowerCase();
    const instructorName = (
      fb.instructorName ||
      fb.instructor?.name ||
      ""
    ).toLowerCase();
    const comment = (fb.comment || "").toLowerCase();
    return (
      studentName.includes(q) ||
      instructorName.includes(q) ||
      comment.includes(q)
    );
  });

  const statCards = [
    { label: "Instructor Avg", avg: categoryAvg("instructorRating") },
    { label: "Gears Avg", avg: categoryAvg("gearsRating") },
    { label: "Motorcycles Avg", avg: categoryAvg("motorcyclesRating") },
    { label: "Scheduling Avg", avg: categoryAvg("schedulingRating") },
    { label: "Referral Avg", avg: categoryAvg("referralRating") },
  ].filter((s) => s.avg !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Student Feedback</h1>
        <p className="text-muted-foreground mt-1">
          All feedback submitted by students
        </p>
      </div>

      {/* Stats Row */}
      {allFeedback.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Overall Avg</p>
              <p className="text-2xl font-bold mt-1">{overallAvg ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {allFeedback.length} submissions
              </p>
            </CardContent>
          </Card>
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.avg}</p>
                <StarRating value={Math.round(Number(s.avg))} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by student, instructor or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            All Feedback ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader className="animate-spin w-4 h-4" />
              <span>Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {search
                ? "No feedback matches your search."
                : "No feedback submitted yet."}
            </p>
          ) : (
            <div className="space-y-4">
              {filtered
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((fb) => (
                  <FeedbackCard key={fb._id || fb.id} fb={fb} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminsFeedbackPage;
