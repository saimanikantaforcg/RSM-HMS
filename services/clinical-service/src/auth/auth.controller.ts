import {
  Controller, Post, Body, HttpCode, HttpStatus, Get,
  Res, Req, UnauthorizedException, ForbiddenException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService, LoginDto } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

const COOKIE_OPTIONS = {
  httpOnly: true,    // Inaccessible to JavaScript (XSS protection)
  secure: process.env.NODE_ENV === 'production',  // HTTPS-only in prod
  sameSite: 'strict' as const,  // CSRF protection
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Sets accessToken and refreshToken as HttpOnly cookies.
   * Also returns them in the body for API clients (Swagger, mobile).
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const device = req.headers['user-agent'] || 'unknown';
    
    const tokens = await this.authService.loginWithMeta(body, ip, device);
    this.setTokenCookies(res, tokens);
    
    // Return only access token and user in body for security
    return {
      accessToken: tokens.accessToken,
      user: tokens.user,
    };
  }

  /**
   * POST /api/v1/auth/refresh
   * Reads refreshToken from cookie OR body, issues new access token.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { refreshToken?: string },
  ) {
    const token = req.cookies?.refreshToken ?? body.refreshToken;
    if (!token) throw new UnauthorizedException('No refresh token provided');
    const tokens = await this.authService.refresh(token);
    this.setTokenCookies(res, tokens);
    return tokens;
  }

  /**
   * POST /api/v1/auth/logout
   * Clears auth cookies and invalidates session in Redis.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const device = req.headers['user-agent'] || 'unknown';
    await this.authService.logout(user.sub, device);
    
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return { message: 'Logged out successfully.' };
  }

  /**
   * GET /api/v1/auth/csrf-token
   * Issues a CSRF token cookie (non-HttpOnly). Frontend must read this cookie
   * and send it as the x-csrf-token header on all mutating requests.
   * The CsrfMiddleware automatically sets the cookie on all GET requests;
   * this endpoint exists as an explicit bootstrap call after login.
   */
  @Public()
  @Get('csrf-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  csrfToken() {
    // The CsrfMiddleware sets the cookie in the response for this GET.
    // Nothing to return in the body.
    return;
  }

  /**
   * GET /api/v1/auth/me
   * Returns the current authenticated user's profile (from JWT).
   * Used by the frontend AuthGuard to verify session without localStorage.
   */
  @Get('me')
  @ApiBearerAuth('JWT')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  /**
   * GET /api/v1/auth/seed
   * DEV ONLY — seeds demo admin. REMOVE before going live.
   */
  @Public()
  @Get('seed')
  async seed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Database seeding is restricted to development environments.');
    }
    return this.authService.seedDemoUser();
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    res.cookie('accessToken', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000,    // 8 hours
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    });
  }
}
