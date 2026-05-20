import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async getMessages(tenantId: string, userId: string) {
    return this.notifRepo.find({
      where: { tenantId, userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async sendMessage(data: any, tenantId: string, senderId: string): Promise<Notification> {
    const msg = this.notifRepo.create({
      tenantId,
      userId: data.recipientId ?? senderId,
      title: data.subject ?? 'Message',
      message: data.body ?? data.message ?? '',
      type: 'clinical',
      isRead: false,
    });
    return this.notifRepo.save(msg);
  }
}
