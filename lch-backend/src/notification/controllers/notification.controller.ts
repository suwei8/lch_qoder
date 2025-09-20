import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { Notification, NotificationType, NotificationPriority } from '../entities/notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 获取所有通知
  @Get()
  findAll() {
    return this.notificationService.findAll();
  }

  // 获取通知统计
  @Get('statistics')
  getStatistics() {
    return this.notificationService.getStatistics();
  }

  // 获取用户通知
  @Get('user/:userId')
  getUserNotifications(@Param('userId') userId: string) {
    return this.notificationService.getUserNotifications(+userId);
  }

  // 获取未读通知数量
  @Get('user/:userId/unread-count')
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationService.getUnreadCount(+userId);
  }

  // 创建通知
  @Post()
  create(@Body() createNotificationDto: Partial<Notification>) {
    return this.notificationService.create(createNotificationDto);
  }

  // 发送系统通知
  @Post('system')
  sendSystemNotification(
    @Body() body: {
      title: string;
      content: string;
      priority?: NotificationPriority;
    }
  ) {
    return this.notificationService.sendSystemNotification({
      title: body.title,
      content: body.content,
      priority: body.priority
    });
  }

  // 发送用户通知
  @Post('user')
  sendUserNotification(
    @Body() body: {
      userId: number;
      type: NotificationType;
      title: string;
      content: string;
      extraData?: any;
    }
  ) {
    return this.notificationService.sendUserNotification(body.userId, {
      title: body.title,
      content: body.content,
      type: 'system',
      data: body.extraData
    });
  }

  // 标记为已读
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Body() body: { userId: number }) {
    return this.notificationService.markAsRead(+id, body.userId);
  }

  // 批量标记已读
  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(+userId);
  }

  // 删除通知
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
