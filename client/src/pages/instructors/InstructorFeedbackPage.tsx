import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVER_URL } from "@/lib/server";

const InstructorFeedbackPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
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
    rating: number;
    comment?: string;
    createdAt: string;
    instructorName?: string;
    student?: { name?: string };
    instructor?: { name?: string };
  }
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch instructors
    const token = localStorage.getItem("token");
    fetch(`${SERVER_URL}/instructor/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.instructors)) {
          setInstructors(data.instructors);
        }
      });
  }, [user]);

  const fetchFeedback = React.useCallback(() => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    let url = "";
    if (user.role === "student") {
      url = `${SERVER_URL}/feedback/student/${user.id}`;
    } else if (user.role === "instructor") {
      url = `${SERVER_URL}/feedback/instructor/${user.id}`;
    } else {
      // fallback for other roles, could be extended
      setAllFeedback([]);
      setLoading(false);
      return;
    }
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.feedbacks)) {
          setAllFeedback(data.feedbacks);
        } else {
          setAllFeedback([]);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (!user) return null;
  const isStudent = user.role === "student";
  const isInstructor = user.role === "instructor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor || rating === 0) {
      toast({
        title: "Missing info",
        description: "Please select an instructor and rating",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
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
          instructorId: selectedInstructor,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Feedback submitted!",
          description: "Thank you for your feedback.",
        });
        setRating(0);
        setComment("");
        setSelectedInstructor("");
        fetchFeedback();
      } else {
        toast({
          title: "Submit failed",
          description: data.message || "Try again later.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Submit failed",
        description: "Try again later.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          {isStudent ? "Give Feedback" : "Feedback"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isStudent
            ? "Rate your experience with instructors"
            : "View feedback from students"}
        </p>
      </div>

      {isStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">New Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                value={selectedInstructor}
                onValueChange={setSelectedInstructor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i._id || i.id} value={i._id || i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <p className="text-sm font-medium mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "w-7 h-7 transition-colors",
                          (hover || rating) >= star
                            ? "fill-accent text-accent"
                            : "text-muted-foreground/30",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin w-5 h-5" /> submiting...
                  </span>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(isStudent || isInstructor) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              {isStudent
                ? "Your Past Feedback"
                : isInstructor
                  ? "Feedback For You"
                  : "All Feedback"}{" "}
              ({allFeedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : allFeedback.length === 0 ? (
              <p className="text-muted-foreground text-sm">No feedback yet</p>
            ) : (
              <div className="space-y-4">
                {allFeedback
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((fb) => {
                    const instructorName =
                      fb.instructorName ||
                      fb.instructor?.name ||
                      instructors.find(
                        (i) => (i._id || i.id) === fb.instructorId,
                      )?.name ||
                      fb.instructorId ||
                      "Instructor";
                    return (
                      <div
                        key={fb._id || fb.id}
                        className="p-4 rounded-xl border bg-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {isInstructor
                                ? `Student → You`
                                : `Student → ${instructorName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "w-4 h-4",
                                  fb.rating >= s
                                    ? "fill-accent text-accent"
                                    : "text-muted-foreground/20",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {fb.comment && (
                          <p className="text-sm text-muted-foreground">
                            {fb.comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstructorFeedbackPage;
