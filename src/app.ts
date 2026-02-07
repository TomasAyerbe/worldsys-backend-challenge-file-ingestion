import express, { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { AppEnvironments } from './enums/AppEnvironments';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  if (env.APP_ENV === AppEnvironments.PRODUCTION) {
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }
  app.use(pinoHttp({ logger }));

  app.use(routes);

  app.use(errorHandler);

  return app;
}
