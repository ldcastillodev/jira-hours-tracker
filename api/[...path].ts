import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from '../apps/api/src/main';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app.getHttpAdapter().getInstance()(req, res);
}
