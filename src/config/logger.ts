import { Logger, pino } from 'pino';
import { AppEnvironments } from '../enums/AppEnvironments';
import { env } from './env';

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  ...(env.APP_ENV === AppEnvironments.DEVELOPMENT && {
    transport: { target: 'pino-pretty' },
  }),
});
