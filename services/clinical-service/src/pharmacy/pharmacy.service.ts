import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PharmacyDispense } from '../entities/pharmacy-dispense.entity';
import { Prescription, PRESCRIPTION_TRANSITIONS } from '../entities/prescription.entity';
import { PrescriptionItem } from '../entities/prescription-item.entity';
import { Stock } from '../entities/stock.entity';
import { StockTransaction } from '../entities/stock-transaction.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Invoice } from '../entities/invoice.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DispenseMedicationDto } from './dto/dispense-medication.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(PharmacyDispense)
    private readonly dispenseRepo: Repository<PharmacyDispense>,
    @InjectRepository(Prescription)
    private readonly rxRepo: Repository<Prescription>,
    @InjectRepository(PrescriptionItem)
    private readonly itemRepo: Repository<PrescriptionItem>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(StockTransaction)
    private readonly stockTxRepo: Repository<StockTransaction>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Pharmacist worklist — prescriptions awaiting or partially dispensed */
  async getDispenseQueue(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.rxRepo.findAndCount({
      where: {
        tenantId,
        status: In(['Signed', 'PartiallyDispensed']),
      },
      order: { prescribedAt: 'ASC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  /** History of completed dispense records */
  async getDispenses(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.dispenseRepo.findAndCount({
      where: { tenantId },
      order: { dispensedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Transaction-safe dispense.
   *
   * Atomically:
   *  1. Validate prescription item exists and is in correct state
   *  2. Pessimistic-lock stock row and verify quantity
   *  3. Create dispense record
   *  4. Deduct stock quantity
   *  5. Create stock transaction log
   *  6. Create invoice item (if invoice exists for this encounter)
   *  7. Update prescription item status
   *  8. Update prescription overall status
   *  9. Write audit log
   *
   * All 9 steps commit together or all roll back.
   */
  async dispenseMedication(
    tenantId: string,
    dto: DispenseMedicationDto,
    actorId: string,
    actorName: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Load and validate prescription item
      const rxItem = await manager.findOne(PrescriptionItem, {
        where: { id: dto.prescriptionItemId, tenantId },
      });
      if (!rxItem) throw new NotFoundException(`Prescription item ${dto.prescriptionItemId} not found`);
      if (rxItem.status === 'Dispensed') {
        throw new BadRequestException('This prescription item has already been fully dispensed');
      }
      if (rxItem.status === 'Cancelled') {
        throw new BadRequestException('Cannot dispense a cancelled prescription item');
      }

      const dispenseQty = dto.quantity ?? rxItem.quantityOrdered - rxItem.quantityDispensed;
      if (dispenseQty <= 0) {
        throw new BadRequestException('Dispense quantity must be greater than zero');
      }

      // 2. Pessimistic lock on stock row
      const stock = await manager.findOne(Stock, {
        where: { tenantId, itemName: rxItem.drugName },
        lock: { mode: 'pessimistic_write' },
      });
      if (!stock) {
        throw new NotFoundException(`No stock record found for drug '${rxItem.drugName}'`);
      }
      if (Number(stock.quantity) < dispenseQty) {
        throw new BadRequestException(
          `Insufficient stock for '${rxItem.drugName}'. ` +
          `Available: ${stock.quantity}, Requested: ${dispenseQty}`,
        );
      }

      // 3. Create dispense record
      const dispense = manager.create(PharmacyDispense, {
        tenantId,
        rxReference: rxItem.prescriptionId,
        prescriptionId: rxItem.prescriptionId,
        prescriptionItemId: rxItem.id,
        patientId: dto.patientId,
        patientName: dto.patientName,
        drugName: rxItem.drugName,
        quantity: String(dispenseQty),
        status: 'Dispensed',
      });
      await manager.save(dispense);

      // 4. Deduct stock quantity
      stock.quantity = Number(stock.quantity) - dispenseQty;
      await manager.save(stock);

      // 5. Create stock transaction log
      await manager.save(StockTransaction, {
        tenantId,
        stockId: stock.id,
        type: 'DISPENSE' as const,
        quantity: -dispenseQty,
        reason: `Dispensed for patient ${dto.patientName ?? dto.patientId}. DispenseId: ${dispense.id}`,
        performedBy: actorName,
      });

      // 6. Create invoice item if an encounter invoice exists
      if (dto.encounterId) {
        const invoice = await manager.findOne(Invoice, {
          where: { tenantId, encounterId: dto.encounterId, status: In(['Draft', 'Pending']) },
        });
        if (invoice) {
          await manager.save(InvoiceItem, {
            tenantId,
            invoiceId: invoice.id,
            description: `${rxItem.drugName} x${dispenseQty}`,
            type: 'Pharmacy',
            quantity: dispenseQty,
            unitPrice: dto.unitPrice ?? 0,
            taxRate: dto.taxRate ?? 12,
            totalPrice: dispenseQty * (dto.unitPrice ?? 0),
          });
        }
      }

      // 7. Update prescription item status
      rxItem.quantityDispensed += dispenseQty;
      const remaining = rxItem.quantityOrdered - rxItem.quantityDispensed;
      rxItem.status = remaining <= 0 ? 'Dispensed' : 'PartiallyDispensed';
      await manager.save(rxItem);

      // 8. Update prescription overall status based on all items
      const allItems = await manager.find(PrescriptionItem, {
        where: { prescriptionId: rxItem.prescriptionId, tenantId },
      });
      const allDispensed = allItems.every((i) => i.status === 'Dispensed');
      const anyDispensed = allItems.some((i) =>
        i.status === 'Dispensed' || i.status === 'PartiallyDispensed',
      );
      const rx = await manager.findOne(Prescription, {
        where: { id: rxItem.prescriptionId, tenantId },
      });
      if (rx) {
        const newRxStatus = allDispensed
          ? 'Dispensed'
          : anyDispensed
          ? 'PartiallyDispensed'
          : rx.status;
        const allowed = PRESCRIPTION_TRANSITIONS[rx.status];
        if (allowed.includes(newRxStatus as any)) {
          rx.status = newRxStatus as any;
          await manager.save(rx);
        }
      }

      // 9. Audit log (written inside transaction — fails atomically with the rest)
      await this.auditLog.log({
        tenantId,
        userId: actorId,
        action: 'CREATE',
        entityName: 'PharmacyDispense',
        entityId: dispense.id,
        changes: {
          prescriptionItemId: rxItem.id,
          drug: rxItem.drugName,
          qty: dispenseQty,
          stockRemaining: stock.quantity,
        },
      });

      return dispense;
    });
  }
}
