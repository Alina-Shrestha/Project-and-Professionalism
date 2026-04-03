export type NotificationType = "chat" | "reminder" | "system" | "success";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: number;
}

const STORAGE_KEY = "cheeryman_notifications";
const MAX_NOTIFICATIONS = 50;
const DEDUPE_WINDOW_MS = 10_000;

export const getNotifications = (): AppNotification[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cheeryman:notifications-updated"));
  }
};

export const addNotification = (
  title: string,
  message: string,
  type: NotificationType = "system"
) => {
  const notifications = getNotifications();

  // Prevent rapid duplicate notifications (same title/message/type) from spamming the feed.
  const latest = notifications[0];
  if (
    latest &&
    latest.title === title &&
    latest.message === message &&
    latest.type === type &&
    Date.now() - latest.createdAt < DEDUPE_WINDOW_MS
  ) {
    return;
  }

  notifications.unshift({
    id: crypto.randomUUID(),
    title,
    message,
    type,
    isRead: false,
    createdAt: Date.now(),
  });

  saveNotifications(notifications.slice(0, MAX_NOTIFICATIONS));
};

export const markAsRead = (id: string) => {
  const notifications = getNotifications().map((n) =>
    n.id === id ? { ...n, isRead: true } : n
  );
  saveNotifications(notifications);
};

export const unreadCount = () =>
  getNotifications().filter((n) => !n.isRead).length;

export const markAllAsRead = () => {
  const notifications = getNotifications().map((n) => ({ ...n, isRead: true }));
  saveNotifications(notifications);
};

export const clearNotifications = () => {
  saveNotifications([]);
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
};

export const sendBrowserNotification = (title: string, body: string) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      tag: "cheeryman-reminder",
      renotify: true,
    });
  } catch (error) {
    console.error("Failed to send browser notification:", error);
  }
};
