import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
  ) {}

  async getDocuments(tenantId: string): Promise<Document[]> {
    return this.docRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async uploadDocument(data: any, tenantId: string, uploadedBy?: string): Promise<Document> {
    const doc = this.docRepo.create({
      tenantId,
      patientId: data.patientId ?? null,
      patient: data.patient ?? null,
      type: data.type,
      fileUrl: data.url ?? data.fileUrl ?? '',
      originalName: data.originalName ?? null,
      status: 'Active',
      uploadedBy: uploadedBy ?? null,
    });
    return this.docRepo.save(doc);
  }
}
