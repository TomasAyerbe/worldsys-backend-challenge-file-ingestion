import { ProcessingStatus } from '../enums/ProcessingStatus';
import { ValidationError } from './ValidationError';

export type ProcessingState = {
  status: ProcessingStatus;
  startedAt: Date | null;
  finishedAt: Date | null;
  totalLinesRead: number;
  totalInserted: number;
  totalErrors: number;
  currentBatch: number;
  errors: ValidationError[];
};
