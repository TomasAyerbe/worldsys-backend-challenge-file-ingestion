import 'dotenv/config';
import { createApp } from './app';
import { closePool, getPool } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { clientService } from './container';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  await getPool();
  logger.info('Database connection established');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT} in ${env.APP_ENV} mode`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    await clientService.stopProcessing();
    await closePool();

    clearTimeout(forceExit);
    logger.info('Server closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.fatal(error, 'Failed to start server');
  process.exit(1);
});
