import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmrNote } from '../entities/emr-note.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class EmrService {
  constructor(
    @InjectRepository(EmrNote)
    private emrRepo: Repository<EmrNote>,
  ) {}

  async getNotes(tenantId: string, patientId?: string) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;

    const notes = await this.emrRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
    
    return notes.map(n => ({
      id: n.id,
      patient: n.patientName,
      patientId: n.patientId,
      author: n.author,
      type: n.type,
      status: n.status,
      date: n.createdAt.toISOString().split('T')[0],
      content: n.content
    }));
  }

  async signNote(tenantId: string, data: any) {
    // 1. Save SOAP Note
    const note = this.emrRepo.create({
      tenantId,
      patientId: data.patientId || randomUUID(),
      patientName: data.patientName || data.patient,
      author: data.author || 'Dr. Clinical',
      type: data.type || 'Progress Note',
      content: data.content || JSON.stringify(data.soap),
      status: 'Signed'
    });
    const savedNote = await this.emrRepo.save(note);

    // Lab orders, prescriptions, and invoices are created deliberately via
    // their own endpoints (/lab-orders, /prescriptions, /billing/invoices).
    // Auto-linking here was removed to maintain explicit clinical workflow.

    return savedNote;
  }
}

