import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AppService {
  login(email: string, pass: string): any {
    // Draft implementation: Validates against a hardcoded admin for Phase 4 proof-of-concept
    if (email === 'admin@hms.internal' && pass === 'password') {
      return {
        accessToken: 'jwt-header.eyJzdWIiOiAiYWRtaW4wMSIsICJ0ZW5hbnRfaWQiOiAiaHNwXzAwaDEiLCAicm9sZSI6ICJzdXBlcl9hZG1pbiJ9.jwt-sig',
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  register(user: any): any {
    return {
      id: `usr_${Date.now()}`,
      tenantId: 'hsp_00h1',
      status: 'active',
      ...user,
    };
  }
}
