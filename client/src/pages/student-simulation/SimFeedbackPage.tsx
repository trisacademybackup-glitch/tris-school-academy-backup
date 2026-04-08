import React, { useEffect, useState } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Loader2,
  MessageSquare,
  RefreshCw,
  Calendar,
  User,
} from "lucide-react";
import { SERVER_URL } from "@/lib/server";
import { cn } from "@/lib/utils";

interface Feedback {
  _id: string;
  instructor?: { _id?: string; name?: string };
  classSession?: { _id?: string; date?: string; startTime?: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

const StarRating = ({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={cn(
          size === "lg" ? "w-5 h-5" : "w-4 h-4",
          i <= rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-muted-foreground/30",
        )}
      />
    ))}
  </div>
);

const SimFeedbackPage = () => {
  const { simulatedStudent } = useSimulation();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = simulatedStudent?._id || simulatedStudent?.id || "";

  const fetchFeedback = () => {
    if (!studentId) return;
    setLoading(true);
    const token = localStorage.getItem("token");

    fetch(`${SERVER_URL}/admin/simulate/feedback?studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setFeedback(data.feedbacks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedback();
  }, [studentId]);

  if (!simulatedStudent) return null;

  const avgRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Feedback History</h1>
          <p className="text-muted-foreground mt-1">
            All feedback submitted by {simulatedStudent.name}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedback}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {feedback.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{feedback.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-500">{avgRating}</p>
              <div className="flex justify-center mt-1">
                {avgRating && (
                  <StarRating rating={Math.round(parseFloat(avgRating))} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">
                {
                  new Set(
                    feedback.map((f) => f.instructor?._id).filter(Boolean),
                  ).size
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Instructors Rated
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading feedback…</span>
          </div>
        </div>
      ) : feedback.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No feedback yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {simulatedStudent.name} hasn't submitted any feedback.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <StarRating rating={item.rating} size="lg" />
                      <Badge variant="outline" className="text-xs">
                        {item.rating}/5
                      </Badge>
                    </div>

                    {item.comment && (
                      <blockquote className="mt-3 text-sm text-foreground border-l-2 border-primary/30 pl-3 italic">
                        "{item.comment}"
                      </blockquote>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      {item.instructor?.name && (
                        <span className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          {item.instructor.name}
                        </span>
                      )}
                      {item.classSession?.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Class on{" "}
                          {new Date(item.classSession.date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                          {item.classSession.startTime &&
                            ` at ${item.classSession.startTime}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                    <p>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimFeedbackPage;
