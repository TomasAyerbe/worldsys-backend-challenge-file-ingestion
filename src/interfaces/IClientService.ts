import { ProcessingState } from '../types/ProcessingState';

export interface IClientService {
  startProcessing(): void;
  stopProcessing(): Promise<void>;
  getState(): ProcessingState;
}
