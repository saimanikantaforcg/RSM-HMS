import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PostPaymentDto } from './dto/post-payment.dto';

@UseGuards(RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('transactions')
  @Roles('billing_officer', 'hospital_admin')
  getTransactions(@Req() req: any) {
    return this.paymentsService.getTransactions(req.tenantId);
  }

  @Post('post')
  @Roles('billing_officer', 'hospital_admin')
  postPayment(@Req() req: any, @Body() dto: PostPaymentDto) {
    return this.paymentsService.postPayment(req.tenantId, dto);
  }
}
