import { ProcessingStatus } from '../enums/ProcessingStatus';
import { ProcessingState } from '../types/ProcessingState';
import { ValidationError } from '../types/ValidationError';

export interface IProcessingStateManager {
  changeStatus(status: ProcessingStatus): void;
  getState(): ProcessingState;
  incrementLinesRead(count: number): void;
  incrementInserted(count: number): void;
  incrementBatch(): void;
  recordError(error: ValidationError): void;
  resetState(): void;
}
