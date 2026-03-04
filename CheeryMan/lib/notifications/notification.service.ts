export type NotificationType = "chat" | "reminder" | "system";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: number;
}

const STORAGE_KEY = "cheeryman_notifications";

export const getNotifications = (): AppNotification[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export const addNotification = (
  title: string,
  message: string,
  type: NotificationType = "system"
) => {
  const notifications = getNotifications();

  notifications.unshift({
    id: crypto.randomUUID(),
    title,
    message,
    type,
    isRead: false,
    createdAt: Date.now(),
  });

  saveNotifications(notifications);
};

export const markAsRead = (id: string) => {
  const notifications = getNotifications().map((n) =>
    n.id === id ? { ...n, isRead: true } : n
  );
  saveNotifications(notifications);
};

export const unreadCount = () =>
  getNotifications().filter((n) => !n.isRead).length;
