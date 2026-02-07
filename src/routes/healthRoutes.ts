import { Request, Response, Router } from 'express';
import { HttpStatusCodes } from '../enums/HttpStatusCodes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(HttpStatusCodes.OK).json({ status: 'ok' });
});

export default router;
