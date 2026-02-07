import { Router } from 'express';
import { clientController } from '../container';
import { createClientRouter } from './clientRoutes';
import healthRoutes from './healthRoutes';
import metricsRoutes from './metricsRoutes';

const router = Router();

router.use(healthRoutes);
router.use(metricsRoutes);
router.use(createClientRouter(clientController));

export default router;
