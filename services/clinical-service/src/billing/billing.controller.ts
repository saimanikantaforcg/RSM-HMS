import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AddInvoiceItemDto } from './dto/add-invoice-item.dto';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /** GET /api/v1/billing/invoices */
  @Get('invoices')
  @Roles('billing_officer', 'hospital_admin', 'doctor', 'receptionist')
  getInvoices(
    @CurrentUser() user: any,
    @Query('patientId') patientId: string,
    @Query('encounterId') encounterId: string,
    @Query() query: PaginationDto,
  ) {
    return this.billingService.getInvoices(user.tenantId, { patientId, encounterId }, query);
  }

  /** GET /api/v1/billing/invoices/:id */
  @Get('invoices/:id')
  @Roles('billing_officer', 'hospital_admin', 'doctor', 'receptionist')
  getInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billingService.getInvoice(id, user.tenantId);
  }

  /** POST /api/v1/billing/invoices — create draft invoice for an encounter */
  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @Roles('billing_officer', 'hospital_admin', 'receptionist')
  createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.billingService.createInvoice(dto, user.tenantId, user.id);
  }

  /** POST /api/v1/billing/invoices/:id/items */
  @Post('invoices/:id/items')
  @HttpCode(HttpStatus.CREATED)
  @Roles('billing_officer', 'hospital_admin')
  addItem(
    @Param('id') id: string,
    @Body() dto: AddInvoiceItemDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.addItem(id, dto, user.tenantId);
  }

  /** DELETE /api/v1/billing/invoices/:id/items/:itemId */
  @Delete('invoices/:id/items/:itemId')
  @Roles('billing_officer', 'hospital_admin')
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.billingService.removeItem(id, itemId, user.tenantId);
  }

  /** PATCH /api/v1/billing/invoices/:id/discount */
  @Patch('invoices/:id/discount')
  @Roles('hospital_admin')
  applyDiscount(
    @Param('id') id: string,
    @Body() dto: ApplyDiscountDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.applyDiscount(id, dto.discount, user.tenantId, user.id);
  }

  /** POST /api/v1/billing/invoices/:id/pay — transaction-safe payment */
  @Post('invoices/:id/pay')
  @HttpCode(HttpStatus.CREATED)
  @Roles('billing_officer', 'hospital_admin')
  collectPayment(
    @Param('id') id: string,
    @Body() dto: CollectPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.collectPayment(id, dto, user.tenantId, user.id);
  }

  /** PATCH /api/v1/billing/invoices/:id/status */
  @Patch('invoices/:id/status')
  @Roles('billing_officer', 'hospital_admin')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.billingService.updateStatus(id, status as any, user.tenantId, user.id);
  }

  /** GET /api/v1/billing/invoices/:id/receipt */
  @Get('invoices/:id/receipt')
  @Roles('billing_officer', 'hospital_admin', 'receptionist')
  getReceipt(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billingService.getReceipt(id, user.tenantId);
  }

  /** GET /api/v1/billing/stats */
  @Get('stats')
  @Roles('hospital_admin', 'billing_officer')
  getStats(@CurrentUser() user: any) {
    return this.billingService.getDashboardStats(user.tenantId);
  }

  /** GET /api/v1/billing/catalog */
  @Get('catalog')
  @Roles('billing_officer', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
  getCatalog(@CurrentUser() user: any) {
    return this.billingService.getCatalog(user.tenantId);
  }
}

