import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVER_URL } from "@/lib/server";
import { Badge } from "@/components/ui/badge";

// ── Star Rating Component ──────────────────────────────────────────────────────
const StarRating = ({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) => {
  const [hover, setHover] = useState(0);
  const cls = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange?.(star)}
          className={cn("p-0.5", readOnly && "cursor-default")}
        >
          <Star
            className={cn(
              cls,
              "transition-colors",
              (hover || value) >= star
                ? "fill-accent text-accent"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
};

// ── Category Section ──────────────────────────────────────────────────────────
const FeedbackSection = ({
  label,
  description,
  rating,
  comment,
  onRating,
  onComment,
  showComment = true,
}: {
  label: string;
  description: string;
  rating: number;
  comment?: string;
  onRating: (v: number) => void;
  onComment?: (v: string) => void;
  showComment?: boolean;
}) => (
  <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">
        <StarRating value={rating} onChange={onRating} />
      </div>
    </div>
    {showComment && onComment && rating > 0 && (
      <Textarea
        placeholder={`Optional comment about ${label.toLowerCase()}...`}
        value={comment || ""}
        onChange={(e) => onComment(e.target.value)}
        rows={2}
        className="text-sm"
      />
    )}
  </div>
);

// ── Past Feedback Card ────────────────────────────────────────────────────────
const PastFeedbackCard = ({
  fb,
  instructors,
}: {
  fb: any;
  instructors: any[];
}) => {
  const [expanded, setExpanded] = useState(false);

  const hasCategories =
    fb.instructorRating ||
    fb.gearsRating ||
    fb.motorcyclesRating ||
    fb.schedulingRating ||
    fb.referralRating;

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
    { label: "Referral likelihood", rating: fb.referralRating },
  ].filter((c) => c.rating);

  const instructorName =
    fb.instructorName ||
    fb.instructor?.name ||
    instructors.find((i) => (i._id || i.id) === fb.instructorId)?.name ||
    "General Feedback";

  return (
    <div className="p-4 rounded-xl border bg-card">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <p className="font-medium text-sm">{instructorName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(fb.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {fb.rating && <StarRating value={fb.rating} readOnly size="sm" />}
          {hasCategories && (
            <Badge variant="outline" className="text-xs">
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            </Badge>
          )}
        </div>
      </div>

      {fb.comment && (
        <p className="text-sm text-muted-foreground mb-2">"{fb.comment}"</p>
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
            {expanded ? "Hide" : "Show"} category ratings
          </button>
          {expanded && (
            <div className="mt-3 space-y-2">
              {categories.map((c) => (
                <div
                  key={c.label}
                  className="flex items-start justify-between text-xs gap-2"
                >
                  <div>
                    <p className="font-medium">{c.label}</p>
                    {c.comment && (
                      <p className="text-muted-foreground">"{c.comment}"</p>
                    )}
                  </div>
                  <StarRating value={c.rating} readOnly size="sm" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const StudentFeedbackPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [instructorRating, setInstructorRating] = useState(0);
  const [instructorComment, setInstructorComment] = useState("");
  const [gearsRating, setGearsRating] = useState(0);
  const [gearsComment, setGearsComment] = useState("");
  const [motorcyclesRating, setMotorcyclesRating] = useState(0);
  const [motorcyclesComment, setMotorcyclesComment] = useState("");
  const [schedulingRating, setSchedulingRating] = useState(0);
  const [schedulingComment, setSchedulingComment] = useState("");
  const [referralRating, setReferralRating] = useState(0);

  interface Instructor {
    _id?: string;
    id?: string;
    name: string;
  }
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
    student?: { name?: string };
    instructor?: { name?: string };
  }

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    fetch(`${SERVER_URL}/instructor/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.instructors))
          setInstructors(data.instructors);
      });
  }, [user]);

  const fetchFeedback = React.useCallback(() => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${SERVER_URL}/feedback/student/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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

  const hasAnyRating =
    instructorRating > 0 ||
    gearsRating > 0 ||
    motorcyclesRating > 0 ||
    schedulingRating > 0 ||
    referralRating > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyRating) {
      toast({
        title: "Nothing to submit",
        description: "Please rate at least one category.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${SERVER_URL}/feedback/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: user.id,
          instructorRating: instructorRating || undefined,
          instructorComment: instructorComment || undefined,
          gearsRating: gearsRating || undefined,
          gearsComment: gearsComment || undefined,
          motorcyclesRating: motorcyclesRating || undefined,
          motorcyclesComment: motorcyclesComment || undefined,
          schedulingRating: schedulingRating || undefined,
          schedulingComment: schedulingComment || undefined,
          referralRating: referralRating || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Feedback submitted!",
          description: "Thank you for your feedback.",
        });
        setInstructorRating(0);
        setInstructorComment("");
        setGearsRating(0);
        setGearsComment("");
        setMotorcyclesRating(0);
        setMotorcyclesComment("");
        setSchedulingRating(0);
        setSchedulingComment("");
        setReferralRating(0);
        fetchFeedback();
      } else {
        toast({
          title: "Submit failed",
          description: data.message || "Try again later.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Submit failed",
        description: "Network error. Try again later.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Give Feedback</h1>
        <p className="text-muted-foreground mt-1">
          Rate your experience — all sections are optional, fill in what matters
          most to you
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Share Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FeedbackSection
              label="Instructor"
              description="How was your experience with your driving instructor?"
              rating={instructorRating}
              comment={instructorComment}
              onRating={setInstructorRating}
              onComment={setInstructorComment}
            />
            <FeedbackSection
              label="Gears & Equipment"
              description="How were the helmets, gloves, and protective gear provided?"
              rating={gearsRating}
              comment={gearsComment}
              onRating={setGearsRating}
              onComment={setGearsComment}
            />
            <FeedbackSection
              label="Motorcycles"
              description="How were the motorcycles — condition, suitability, maintenance?"
              rating={motorcyclesRating}
              comment={motorcyclesComment}
              onRating={setMotorcyclesRating}
              onComment={setMotorcyclesComment}
            />
            <FeedbackSection
              label="Scheduling"
              description="How smooth was the booking and scheduling process?"
              rating={schedulingRating}
              comment={schedulingComment}
              onRating={setSchedulingRating}
              onComment={setSchedulingComment}
            />
            <FeedbackSection
              label="Likelihood to Refer Someone"
              description="How likely are you to recommend Tris Academy to a friend or family member?"
              rating={referralRating}
              onRating={setReferralRating}
              showComment={false}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-accent text-white hover:bg-accent/90 w-full sm:w-auto"
                disabled={submitting || !hasAnyRating}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin w-4 h-4" /> Submitting...
                  </span>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                All categories are optional — submit only what you'd like to
                share.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">
            Your Past Feedback ({allFeedback.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : allFeedback.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No feedback submitted yet
            </p>
          ) : (
            <div className="space-y-4">
              {allFeedback
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((fb) => (
                  <PastFeedbackCard
                    key={fb._id || fb.id}
                    fb={fb}
                    instructors={instructors}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeedbackPage;
