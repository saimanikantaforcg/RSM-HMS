import 'dotenv/config';
// import './sentry-setup'; // New Sentry 8+ setup pattern
import { NestFactory, Reflector } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logging/winston.config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  // Sentry is initialized in sentry-setup.ts
  if (process.env.SENTRY_DSN) {
    console.log('📡 Sentry initialized via sentry-setup');
  }

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // ─── 1. Helmet — Security headers (XSS, CSRF, clickjacking, etc.) ──────
  app.use((helmet as any).default());

  // Trust X-Forwarded-For from reverse proxy (nginx/k8s ingress) and load balancers
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // ─── 2. Cookie Parser — Required for HttpOnly cookie-based JWT auth ──────
  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET must be defined for secure authentication');
  }
  app.use(cookieParser(cookieSecret));

  // ─── 3. CORS ─────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,    // Required for cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  // ─── 4. Global API prefix — all routes become /api/v1/... ───────────────
  app.setGlobalPrefix('api/v1');

  // ─── 5. Global Validation Pipe — Strict Enterprise Mode ────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true, // Block requests with unknown fields (Injection protection)
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // ─── 6. Global Interceptors & Filters ───────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  
  const httpAdapterHost = app.get(HttpAdapterHost);
  
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // ─── 7. Swagger / OpenAPI Documentation ──────────────────────────────────
  const docConfig = new DocumentBuilder()
    .setTitle('RSM HMS API')
    .setDescription('Enterprise Hospital Management System — REST API Reference')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addCookieAuth('accessToken')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('audit', 'HIPAA Audit Logs')
    .addTag('patients', 'Patient Registry')
    .addTag('encounters', 'Clinical Encounters')
    .addTag('billing', 'Billing & Invoices')
    .addTag('opd', 'Outpatient Department')
    .addTag('ipd', 'Inpatient Department')
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'RSM HMS API Docs',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`\n🏥 RSM HMS Clinical Service → http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger API Docs         → http://localhost:${port}/api/docs`);
  console.log('🔐 JWT Auth Guard ACTIVE — Bearer token OR HttpOnly cookie');
  console.log('🛡️  RBAC Roles Guard ACTIVE — @Roles() decorator enforced globally');
  console.log('📋 HIPAA Audit Log ACTIVE — all mutations tracked');
  console.log('🔑 Dev seed endpoint: GET /api/v1/auth/seed\n');
}
bootstrap();
