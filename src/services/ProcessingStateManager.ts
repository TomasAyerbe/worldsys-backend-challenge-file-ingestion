import { ProcessingStatus } from '../enums/ProcessingStatus';
import { IProcessingStateManager } from '../interfaces/IProcessingStateManager';
import { ProcessingState } from '../types/ProcessingState';
import { ValidationError } from '../types/ValidationError';

const MAX_STORED_ERRORS = 100;

export class ProcessingStateManager implements IProcessingStateManager {
  private state: ProcessingState;

  constructor() {
    this.state = this.createInitialState();
  }

  changeStatus(status: ProcessingStatus): void {
    if (status === ProcessingStatus.PROCESSING) {
      this.state.startedAt = new Date();
      this.state.finishedAt = null;
    }
    if (
      status === ProcessingStatus.COMPLETED ||
      status === ProcessingStatus.FAILED
    ) {
      this.state.finishedAt = new Date();
    }
    this.state.status = status;
  }

  getState(): ProcessingState {
    return { ...this.state, errors: [...this.state.errors] };
  }

  incrementLinesRead(count: number): void {
    this.state.totalLinesRead += count;
  }

  incrementInserted(count: number): void {
    this.state.totalInserted += count;
  }

  incrementBatch(): void {
    this.state.currentBatch++;
  }

  recordError(error: ValidationError): void {
    this.state.totalErrors++;
    if (this.state.errors.length < MAX_STORED_ERRORS) {
      this.state.errors.push(error);
    }
  }

  resetState(): void {
    this.state = this.createInitialState();
  }

  private createInitialState(): ProcessingState {
    return {
      status: ProcessingStatus.IDLE,
      startedAt: null,
      finishedAt: null,
      totalLinesRead: 0,
      totalInserted: 0,
      totalErrors: 0,
      currentBatch: 0,
      errors: [],
    };
  }
}
