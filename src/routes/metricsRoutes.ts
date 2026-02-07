import { Request, Response, Router } from 'express';
import { getProcessMetrics } from '../config/metrics';
import { HttpStatusCodes } from '../enums/HttpStatusCodes';

const router = Router();

router.get('/metrics', (_req: Request, res: Response) => {
  const metrics = getProcessMetrics();
  res.status(HttpStatusCodes.OK).json(metrics);
});

export default router;
