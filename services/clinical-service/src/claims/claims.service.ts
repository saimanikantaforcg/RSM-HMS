import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from '../entities/claim.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private claimRepo: Repository<Claim>
  ) {}

  async getClaims(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const claims = await this.claimRepo.find({
      where: { tenantId },
      order: { submittedDate: 'DESC' },
      take: 50,
    });
    
    // Return full UUID as id so the frontend can pass it back for settle-batch
    return claims.map(c => ({
      id: c.id,
      payer: c.payer,
      patient: c.patientName,
      amount: `$${Number(c.claimAmount).toFixed(2)}`,
      submitted: c.submittedDate.toISOString().split('T')[0],
      status: c.status
    }));
  }

  async submitClaim(tenantId: string, data: any) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const amount = parseFloat(data.amount || '0');
    const claim = this.claimRepo.create({
      tenantId,
      patientId: randomUUID(),
      patientName: data.patient,
      payer: data.payer,
      claimAmount: amount,
      status: 'Submitted'
    });

    const saved = await this.claimRepo.save(claim);
    return saved;
  }

  async settleBatch(tenantId: string, data: { claimIds: string[], transactionRef: string }) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    // Use full UUIDs for exact matching — no truncation, no O(n) scan
    let count = 0;
    for (const claimId of data.claimIds) {
      const result = await this.claimRepo.update(
        { id: claimId, tenantId },
        { status: 'Approved' },
      );
      count += result.affected ?? 0;
    }
    return { success: true, settledCount: count, transactionRef: data.transactionRef };
  }
}
