import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@UseGuards(RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('config')
  @Roles('hospital_admin', 'super_admin')
  getConfig(@CurrentUser() user: any) {
    return this.settingsService.getConfig(user.tenantId);
  }

  @Post('update')
  @Roles('hospital_admin', 'super_admin')
  updateConfig(@Body() dto: UpdateSettingsDto, @CurrentUser() user: any) {
    return this.settingsService.updateConfig(user.tenantId, dto);
  }
}
