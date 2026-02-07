import { Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { AppEnvironments } from '../enums/AppEnvironments';
import { LogLevels } from '../enums/LogLevels';

const EnvSchema = Type.Object({
  APP_ENV: Type.Enum(AppEnvironments, { default: AppEnvironments.DEVELOPMENT }),
  DB_SERVER: Type.String(),
  DB_PORT: Type.Number({ default: 1433 }),
  DB_NAME: Type.String(),
  DB_USER: Type.String(),
  DB_PASSWORD: Type.String(),
  LOG_LEVEL: Type.Enum(LogLevels, { default: LogLevels.INFO }),
  PORT: Type.Number({ default: 3000 }),
});

type Env = Static<typeof EnvSchema>;

const parse = Value.Parse.bind(Value) as (
  schema: typeof EnvSchema,
  value: NodeJS.ProcessEnv,
) => Env;

export const env: Env = parse(EnvSchema, process.env);
