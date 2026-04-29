import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { getApp } from '../apps/api/src/main';

// Cache the handler across warm invocations — NestJS bootstraps once per container
let cachedHandler: ReturnType<typeof serverless> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedHandler) {
    const app = await getApp();
    cachedHandler = serverless(app.getHttpAdapter().getInstance());
  }
  return cachedHandler(req, res);
}
