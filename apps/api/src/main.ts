import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

let app: INestApplication | null = null;

export async function getApp(): Promise<INestApplication> {
  if (app) return app;

  app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // CORS only needed for local dev (cross-origin between :5173 and :3001)
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.init();
  return app;
}

async function bootstrap() {
  const nestApp = await getApp();
  const port = process.env.API_PORT || 3001;
  await nestApp.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

// Only auto-start when run directly (local dev / node dist/main.js)
if (require.main === module) {
  bootstrap();
}
