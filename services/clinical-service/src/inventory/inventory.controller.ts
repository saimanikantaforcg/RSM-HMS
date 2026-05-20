import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AddStockDto } from './dto/add-stock.dto';

@UseGuards(RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stocks')
  @Roles('admin', 'pharmacist', 'hospital_admin')
  async getStocks(@Req() req: Request & { tenantId: string }) {
    return await this.inventoryService.getStockList(req.tenantId);
  }

  @Get('alerts')
  @Roles('admin', 'pharmacist', 'hospital_admin')
  async getAlerts(@Req() req: Request & { tenantId: string }) {
    return await this.inventoryService.getLowStockAlerts(req.tenantId);
  }

  @Post('add')
  @Roles('admin', 'pharmacist', 'hospital_admin')
  async addStock(
    @Req() req: Request & { tenantId: string },
    @Body() dto: AddStockDto,
  ) {
    return await this.inventoryService.addStock(req.tenantId, dto);
  }
}
