"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { Bell, Check, CheckCheck } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  job?: { id: string; name: string; jobNumber: string };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck size={16} className="mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`transition-colors ${!n.read ? "bg-blue-50 border-blue-200" : ""}`}
          >
            <div className="flex items-start gap-4 p-4">
              <div className={`rounded-full p-2 ${!n.read ? "bg-blue-100" : "bg-gray-100"}`}>
                <Bell size={16} className={!n.read ? "text-blue-600" : "text-gray-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-medium ${!n.read ? "text-gray-900" : "text-gray-600"}`}>
                    {n.title}
                  </h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                {n.job && (
                  <Link
                    href={`/jobs/${n.job.id}`}
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    {n.job.jobNumber} — {n.job.name}
                  </Link>
                )}
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="p-1 text-gray-400 hover:text-green-500"
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No notifications yet
          </div>
        )}
      </div>
    </div>
  );
}
