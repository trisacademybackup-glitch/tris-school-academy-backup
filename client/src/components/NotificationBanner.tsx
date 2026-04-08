import { useEffect, useState } from "react";
import {
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVER_URL } from "@/lib/server";

export interface AppNotification {
  _id: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  active: boolean;
  date?: string | null;
  venue?: string | null;
  expiryDate?: string | null;
  createdAt: string;
}

const typeConfig = {
  info: {
    icon: Info,
    className:
      "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
    iconClass: "text-blue-500",
    lightColor: "rgb(59 130 246)", // blue-500
  },
  warning: {
    icon: AlertTriangle,
    className:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-200",
    iconClass: "text-yellow-500",
    lightColor: "rgb(234 179 8)", // yellow-500
  },
  success: {
    icon: CheckCircle2,
    className:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-200",
    iconClass: "text-green-500",
    lightColor: "rgb(34 197 94)", // green-500
  },
  error: {
    icon: XCircle,
    className:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
    iconClass: "text-red-500",
    lightColor: "rgb(239 68 68)", // red-500
  },
};

// Exported so DashboardLayout can reuse the same fetch
export async function fetchLiveNotifications(): Promise<AppNotification[]> {
  try {
    const res = await fetch(`${SERVER_URL}/settings`);
    const data = await res.json();
    if (data.success && data.settings?.activeNotifications) {
      return data.settings.activeNotifications as AppNotification[];
    }
  } catch {
    // silently fail — notifications are non-critical
  }
  return [];
}

export const NotificationBanner = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLiveNotifications().then(setNotifications);
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n._id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1 mb-3">
      {visible.map((notif) => {
        const config = typeConfig[notif.type] || typeConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={notif._id}
            className={cn(
              "notif-glow flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium",
              config.className,
            )}
            style={{ "--notif-glow": config.lightColor } as React.CSSProperties}
          >
            <Icon
              className={cn("h-4 w-4 flex-shrink-0 mt-0.5", config.iconClass)}
            />
            <div className="flex-1 min-w-0">
              <p>{notif.message}</p>
              {(notif.date || notif.venue) && (
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs opacity-80">
                  {notif.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(notif.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  )}
                  {notif.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {notif.venue}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() =>
                setDismissed((prev) => new Set([...prev, notif._id]))
              }
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-2 mt-0.5"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationBanner;
