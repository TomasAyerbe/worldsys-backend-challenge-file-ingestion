import { Client } from '../models/Client';
import { ValidationError } from './ValidationError';

type ParsedLineSuccess = {
  success: true;
  client: Client;
};

type ParsedLineFailure = {
  success: false;
  error: ValidationError;
};

export type ParsedLine = ParsedLineSuccess | ParsedLineFailure;
