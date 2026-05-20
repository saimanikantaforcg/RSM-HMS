import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>
  ) {}

  async getTransactions(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const payments = await this.paymentRepo.find({
      where: { tenantId },
      order: { paymentDate: 'DESC' },
      take: 50,
    });
    
    // Return full UUIDs — no short-ID truncation
    return payments.map(p => ({
      id: p.id,
      ref: p.invoiceId,
      type: p.paymentMethod,
      amount: `$${Number(p.amount).toFixed(2)}`,
      date: p.paymentDate.toISOString().split('T')[0],
      status: p.status
    }));
  }

  async postPayment(tenantId: string, data: any) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const amount = parseFloat(data.amount || '0');
    
    // Auto-calculate TDS (10% under Section 194J if threshold met)
    let tds = 0;
    if (amount > 50000) {
       tds = amount * 0.10;
    }

    const payment = this.paymentRepo.create({
      tenantId,
      invoiceId: data.ref,
      amount: amount - tds, // Deducting TDS from final disbursement
      tdsDeducted: tds,
      paymentMethod: data.type,
      status: 'Success'
    });

    const saved = await this.paymentRepo.save(payment);
    return saved;
  }
}
