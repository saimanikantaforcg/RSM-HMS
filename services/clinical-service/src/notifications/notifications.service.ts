import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import Redis from 'ioredis';
import { Inject, OnModuleInit } from '@nestjs/common';

@Injectable()
export class NotificationsService implements OnModuleInit {
  // Global SSE Subject
  private notificationStream = new Subject<Notification>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @Inject('REDIS_PUB') private readonly redisPub: Redis,
    @Inject('REDIS_SUB') private readonly redisSub: Redis,
  ) {}

  onModuleInit() {
    // Listen for notifications from other instances
    this.redisSub.subscribe('hms_notifications');
    this.redisSub.on('message', (channel, message) => {
      if (channel === 'hms_notifications') {
        const notification = JSON.parse(message);
        this.notificationStream.next(notification);
      }
    });
  }

  /** Fire off a new global unread alert via SSE and DB. */
  async emitNotification(tenantId: string, userId: string, title: string, message: string, type: NotificationType) {
    const notification = this.notificationRepo.create({
      tenantId, userId, title, message, type, isRead: false
    });
    
    const saved = await this.notificationRepo.save(notification);
    
    // Broadcast globally via Redis Pub/Sub
    await this.redisPub.publish('hms_notifications', JSON.stringify(saved));
    
    return saved;
  }

  /** Subscribe to a user's specific live event feed. */
  getEventStream(tenantId: string, userId: string): Observable<{ data: Notification }> {
    return this.notificationStream.asObservable().pipe(
      filter(notif => notif.tenantId === tenantId && notif.userId === userId),
      map(notif => ({ data: notif }))
    );
  }

  /** Get historical/unread notifications on initial load. */
  async getUnread(tenantId: string, userId: string) {
    return this.notificationRepo.find({
      where: { tenantId, userId, isRead: false },
      order: { createdAt: 'DESC' },
      take: 20
    });
  }

  /** Set notification state. */
  async markRead(tenantId: string, userId: string, notificationId: string) {
    await this.notificationRepo.update(
      { id: notificationId, tenantId, userId },
      { isRead: true }
    );
    return { success: true };
  }
}
