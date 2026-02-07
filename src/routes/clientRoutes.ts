import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';

export function createClientRouter(controller: ClientController): Router {
  const router = Router();

  router.post('/ingestion/start', controller.startIngestion);
  router.get('/ingestion/status', controller.getStatus);

  return router;
}
