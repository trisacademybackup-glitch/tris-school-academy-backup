import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Award, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const EventInvite = () => {
  const { user } = useAuth();
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-950/30 dark:via-gray-950 dark:to-red-950/30 border-2 border-orange-200 dark:border-orange-800/50 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/20 to-red-200/20 dark:from-orange-500/5 dark:to-red-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/20 to-purple-200/20 dark:from-blue-500/5 dark:to-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20" />

      {/* TVS Logo watermark */}
      <div className="absolute right-4 top-4 opacity-10 dark:opacity-20">
        <Award
          className="w-24 h-24 text-orange-600 dark:text-orange-400"
          strokeWidth={1}
        />
      </div>

      <div className="relative p-6 md:p-8">
        {/* Header with badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
            <Sparkles className="w-4 h-4" />
            Exclusive Partnership Launch
          </span>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              TVS & Tris Academy Present
            </h2>

            <h3 className="text-xl md:text-2xl font-display font-semibold">
              Apache RTR180
              <br />
              <span className="text-muted-foreground">
                Rider's Training Program
              </span>
            </h3>

            <p className="text-muted-foreground max-w-2xl">
              {user.name?.split(" ")[0] || "Student"}, Join us as TVS and Tris
              Academy come together to support enthusiasts who aspire to enter
              the world of motorcycling. New riders will have access to
              professional riding training at subsidized rates.
            </p>

            {/* Event details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-start gap-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="text-sm font-medium">
                    Saturday, 7th March 2026
                  </p>
                  <p className="text-xs text-muted-foreground">From 8:00 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="text-sm font-medium">
                    Nairobi Children's Traffic Park
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Located on Nyerere Road
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/20 p-3 rounded-lg">
          <Clock className="w-4 h-4" />
          <span>
            Don't miss this opportunity to start your motorcycling journey with
            professional guidance!
          </span>
        </div>
      </div>
    </Card>
  );
};

export default EventInvite;
