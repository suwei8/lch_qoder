import request from '../utils/request';

export interface Notification {
  id: number;
  user_id?: number;
  type: string;
  title: string;
  content: string;
  extra_data?: any;
  is_read: boolean;
  is_global: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_type: 'none' | 'url' | 'page';
  action_data?: string;
  expire_at?: string;
  send_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStatistics {
  total: number;
  unread: number;
  readRate: string;
  byType: Array<{ type: string; count: string }>;
}

// 获取所有通知
export const getNotifications = () => {
  return request.get<Notification[]>('/notifications');
};

// 获取用户通知
export const getUserNotifications = (userId: number) => {
  return request.get<Notification[]>(`/notifications/user/${userId}`);
};

// 获取未读通知数量
export const getUnreadCount = (userId: number) => {
  return request.get<{ count: number }>(`/notifications/user/${userId}/unread-count`);
};

// 创建通知
export const createNotification = (data: Partial<Notification>) => {
  return request.post<Notification>('/notifications', data);
};

// 发送系统通知
export const sendSystemNotification = (title: string, content: string, priority?: string) => {
  return request.post<Notification>('/notifications/system', { title, content, priority });
};

// 发送用户通知
export const sendUserNotification = (userId: number, title: string, content: string, type?: string) => {
  return request.post<Notification>('/notifications/user', { userId, title, content, type });
};

// 标记为已读
export const markAsRead = (id: number) => {
  return request.patch<Notification>(`/notifications/${id}/read`);
};

// 批量标记已读
export const markAllAsRead = (userId: number) => {
  return request.patch(`/notifications/user/${userId}/read-all`);
};

// 删除通知
export const deleteNotification = (id: number) => {
  return request.delete(`/notifications/${id}`);
};

// 获取通知统计
export const getNotificationStatistics = () => {
  return request.get<NotificationStatistics>('/notifications/statistics');
};