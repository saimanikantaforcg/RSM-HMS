import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Payment } from '../entities/payment.entity';
import { ServiceCatalog } from './service-catalog.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AddInvoiceItemDto } from './dto/add-invoice-item.dto';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

/** Invoice status machine — enforced in updateStatus() */
const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ['Pending', 'Cancelled'],
  Pending: ['PartiallyPaid', 'Paid', 'Cancelled'],
  PartiallyPaid: ['Paid', 'Cancelled'],
  Paid: ['Refunded'],
  Cancelled: [],
  Refunded: [],
};

/** Seed catalog used only when service_catalog table is empty for a tenant */
const DEFAULT_CATALOG = [
  { name: 'General Consultation',      code: 'CONSULTATION', category: 'Consultation', unitPrice: 500,  taxRate: 18 },
  { name: 'Specialist Consultation',   code: 'SPECIALIST',   category: 'Consultation', unitPrice: 1200, taxRate: 18 },
  { name: 'Complete Blood Count (CBC)', code: 'CBC',          category: 'Diagnostic',   unitPrice: 350,  taxRate: 18 },
  { name: 'Liver Function Test (LFT)', code: 'LFT',          category: 'Diagnostic',   unitPrice: 600,  taxRate: 18 },
  { name: 'Chest X-Ray',               code: 'CXR',          category: 'Radiology',    unitPrice: 800,  taxRate: 18 },
  { name: 'ECG / EKG',                 code: 'ECG',          category: 'Diagnostic',   unitPrice: 600,  taxRate: 18 },
  { name: 'Drug Unit (per tablet)',     code: 'DRUG_UNIT',    category: 'Pharmacy',     unitPrice: 20,   taxRate: 12 },
] as const;

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)      private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)  private readonly itemRepo: Repository<InvoiceItem>,
    @InjectRepository(Payment)      private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(ServiceCatalog) private readonly catalogRepo: Repository<ServiceCatalog>,
    private readonly dataSource: DataSource,
    private readonly auditLog: AuditLogService,
  ) {}

  async getInvoices(
    tenantId: string,
    filters: { patientId?: string; encounterId?: string },
    query: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = query;
    const where: any = { tenantId };
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.encounterId) where.encounterId = filters.encounterId;

    const [data, total] = await this.invoiceRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  async getInvoice(id: string, tenantId: string) {
    const inv = await this.invoiceRepo.findOne({ where: { id, tenantId } });
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }

  async createInvoice(dto: CreateInvoiceDto, tenantId: string, actorId: string) {
    // Prevent duplicate draft invoices for the same encounter
    const existing = await this.invoiceRepo.findOne({
      where: { tenantId, encounterId: dto.encounterId, status: 'Draft' },
    });
    if (existing) return existing; // idempotent

    const inv = this.invoiceRepo.create({
      tenantId,
      encounterId: dto.encounterId,
      patientId: dto.patientId,
      patientName: dto.patientName,
      totalAmount: 0,
      netAmount: 0,
      taxAmount: 0,
      paidAmount: 0,
      discount: 0,
      status: 'Draft',
      notes: dto.notes,
    });
    const saved = await this.invoiceRepo.save(inv);

    await this.auditLog.log({
      tenantId, userId: actorId, action: 'CREATE',
      entityName: 'Invoice', entityId: saved.id,
      changes: { encounterId: dto.encounterId },
    });

    return saved;
  }

  async addItem(invoiceId: string, dto: AddInvoiceItemDto, tenantId: string) {
    const inv = await this.getInvoice(invoiceId, tenantId);
    if (!['Draft', 'Pending'].includes(inv.status)) {
      throw new BadRequestException(`Cannot add items to invoice in '${inv.status}' status`);
    }

    const taxRate = dto.taxRate ?? 0;
    const subtotal = dto.quantity * dto.unitPrice;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const item = this.itemRepo.create({
      invoiceId,
      description: dto.description,
      type: dto.type ?? 'Service',
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      subtotal,
      taxRate,
      taxAmount,
      total,
    });
    await this.itemRepo.save(item);

    // Recalculate invoice totals
    await this.recalculateTotals(invoiceId, tenantId);

    return item;
  }

  async removeItem(invoiceId: string, itemId: string, tenantId: string) {
    const inv = await this.getInvoice(invoiceId, tenantId);
    if (!['Draft', 'Pending'].includes(inv.status)) {
      throw new BadRequestException(`Cannot remove items from invoice in '${inv.status}' status`);
    }
    await this.itemRepo.delete({ id: itemId, invoiceId });
    await this.recalculateTotals(invoiceId, tenantId);
    return { removed: itemId };
  }

  async applyDiscount(invoiceId: string, discountPct: number, tenantId: string, actorId: string) {
    const inv = await this.getInvoice(invoiceId, tenantId);
    if (!['Draft', 'Pending'].includes(inv.status)) {
      throw new BadRequestException(`Cannot apply discount to invoice in '${inv.status}' status`);
    }

    const discountAmount = (Number(inv.totalAmount) * discountPct) / 100;
    inv.discount = discountAmount;
    inv.netAmount = Number(inv.totalAmount) - discountAmount;
    const saved = await this.invoiceRepo.save(inv);

    await this.auditLog.log({
      tenantId, userId: actorId, action: 'UPDATE',
      entityName: 'Invoice', entityId: invoiceId,
      changes: { discountPct, discountAmount },
    });

    return saved;
  }

  /**
   * Transaction-safe payment collection.
   * Atomically: validates → creates payment → updates paidAmount → transitions status → audit log
   */
  async collectPayment(
    invoiceId: string,
    dto: CollectPaymentDto,
    tenantId: string,
    actorId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // Pessimistic lock to prevent concurrent payment races
      const inv = await manager.findOne(Invoice, {
        where: { id: invoiceId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inv) throw new NotFoundException(`Invoice ${invoiceId} not found`);

      if (!['Pending', 'PartiallyPaid'].includes(inv.status)) {
        throw new BadRequestException(
          `Cannot collect payment for invoice in '${inv.status}' status`,
        );
      }

      const balance = Number(inv.netAmount || inv.totalAmount) - Number(inv.paidAmount);
      if (dto.amount > balance + 0.01) { // small float tolerance
        throw new BadRequestException(
          `Payment amount ${dto.amount} exceeds outstanding balance ${balance.toFixed(2)}`,
        );
      }

      // Create payment record
      const payment = manager.create(Payment, {
        tenantId,
        invoiceId,
        amount: dto.amount,
        paymentMethod: dto.method as any,
        transactionReference: dto.reference,
        status: 'Success',
      });
      await manager.save(payment);

      // Update paid amount and status
      inv.paidAmount = Number(inv.paidAmount) + dto.amount;
      const newBalance = Number(inv.netAmount || inv.totalAmount) - inv.paidAmount;
      inv.status = newBalance <= 0.01 ? 'Paid' : 'PartiallyPaid';
      inv.paymentMethod = dto.method as any;
      await manager.save(inv);

      // Audit log
      await this.auditLog.log({
        tenantId, userId: actorId, action: 'CREATE' as any,
        entityName: 'Payment', entityId: payment.id,
        changes: {
          invoiceId, amount: dto.amount, method: dto.method,
          invoiceStatus: inv.status, balanceRemaining: newBalance,
        },
      });

      return { payment, invoice: inv };
    });
  }

  async updateStatus(invoiceId: string, newStatus: InvoiceStatus, tenantId: string, actorId: string) {
    const inv = await this.getInvoice(invoiceId, tenantId);
    const allowed = INVOICE_TRANSITIONS[inv.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition invoice from '${inv.status}' to '${newStatus}'`,
      );
    }
    const oldStatus = inv.status;
    inv.status = newStatus;
    const saved = await this.invoiceRepo.save(inv);

    await this.auditLog.log({
      tenantId, userId: actorId, action: 'UPDATE',
      entityName: 'Invoice', entityId: invoiceId,
      changes: { statusFrom: oldStatus, statusTo: newStatus },
    });

    return saved;
  }

  async getReceipt(invoiceId: string, tenantId: string) {
    const inv = await this.getInvoice(invoiceId, tenantId);
    const payments = await this.paymentRepo.find({ where: { invoiceId, tenantId } });
    return { invoice: inv, payments };
  }

  async getDashboardStats(tenantId: string) {
    const invoices = await this.invoiceRepo.find({ where: { tenantId } });
    const totalRev = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const collected = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((s, i) => s + Number(i.paidAmount), 0);
    const pending = invoices
      .filter((i) => ['Pending', 'PartiallyPaid'].includes(i.status))
      .reduce((s, i) => s + Number(i.netAmount || i.totalAmount) - Number(i.paidAmount), 0);

    return { totalRevenue: totalRev, collectedAmount: collected, pendingAmount: pending, invoiceCount: invoices.length };
  }

  async getCatalog(tenantId: string): Promise<ServiceCatalog[]> {
    const items = await this.catalogRepo.find({
      where: [
        { tenantId, isActive: true },
        { tenantId: IsNull() as any, isActive: true },
      ],
      order: { category: 'ASC', name: 'ASC' },
    });
    if (items.length === 0) {
      const seeded = this.catalogRepo.create(
        DEFAULT_CATALOG.map((d) => ({ ...d, tenantId: null as any, isActive: true })),
      );
      return this.catalogRepo.save(seeded);
    }
    return items;
  }

  /** Recalculate and save invoice totals based on current items */
  private async recalculateTotals(invoiceId: string, tenantId: string) {
    const [inv, items] = await Promise.all([
      this.invoiceRepo.findOne({ where: { id: invoiceId, tenantId } }),
      this.itemRepo.find({ where: { invoiceId } }),
    ]);
    if (!inv) return;

    const totalAmount = items.reduce((s, i) => s + Number(i.total), 0);
    const taxAmount   = items.reduce((s, i) => s + Number(i.taxAmount), 0);
    inv.totalAmount = totalAmount;
    inv.taxAmount = taxAmount;
    inv.netAmount = totalAmount - Number(inv.discount);
    await this.invoiceRepo.save(inv);
  }
}

