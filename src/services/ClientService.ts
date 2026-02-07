import fs from 'fs';
import readline from 'readline';
import { logger } from '../config/logger';
import { getProcessMetrics } from '../config/metrics';
import { HttpStatusCodes } from '../enums/HttpStatusCodes';
import { ProcessingStatus } from '../enums/ProcessingStatus';
import { HttpError } from '../errors/HttpError';
import { IClientRepository } from '../interfaces/IClientRepository';
import { IClientService } from '../interfaces/IClientService';
import { IFileParser } from '../interfaces/IFileParser';
import { IProcessingStateManager } from '../interfaces/IProcessingStateManager';
import { Client } from '../models/Client';
import { ProcessingState } from '../types/ProcessingState';

const BATCH_SIZE = 100;
const PROGRESS_LOG_INTERVAL = 500;
const FILE_PATH = '/app/data/CLIENTES_IN_0425.dat';

export class ClientService implements IClientService {
  private abortController: AbortController | null = null;
  private processingPromise: Promise<void> | null = null;

  constructor(
    private readonly repository: IClientRepository,
    private readonly parser: IFileParser,
    private readonly stateManager: IProcessingStateManager,
  ) {}

  startProcessing(): void {
    if (this.getState().status === ProcessingStatus.PROCESSING) {
      throw new HttpError(
        HttpStatusCodes.CONFLICT,
        'Processing is already in progress',
      );
    }

    this.stateManager.resetState();
    this.stateManager.changeStatus(ProcessingStatus.PROCESSING);

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.processingPromise = this.processFile(signal)
      .then(() => {
        this.stateManager.changeStatus(ProcessingStatus.COMPLETED);
        const state = this.getState();
        logger.info(
          {
            totalLinesRead: state.totalLinesRead,
            totalInserted: state.totalInserted,
            totalErrors: state.totalErrors,
          },
          'File processing completed',
        );
      })
      .catch((err) => {
        this.stateManager.changeStatus(ProcessingStatus.FAILED);

        if (signal.aborted) {
          logger.info('File processing stopped by shutdown signal');
        } else {
          logger.error(err, 'File processing failed');
        }
      })
      .finally(() => {
        this.abortController = null;
        this.processingPromise = null;
      });
  }

  async stopProcessing(): Promise<void> {
    if (!this.abortController || !this.processingPromise) return;

    this.abortController.abort();
    await this.processingPromise;
  }

  getState(): ProcessingState {
    return this.stateManager.getState();
  }

  private async processFile(signal: AbortSignal): Promise<void> {
    if (!fs.existsSync(FILE_PATH)) {
      throw new Error(`File not found: ${FILE_PATH}`);
    }

    const fileStream = fs.createReadStream(FILE_PATH, {
      encoding: 'utf-8',
    });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let batch: Client[] = [];
    let lineNumber = 0;
    let lastProgressLog = 0;

    try {
      for await (const line of rl) {
        if (signal.aborted) {
          throw new Error('Processing aborted');
        }

        lineNumber++;
        this.stateManager.incrementLinesRead(1);

        const result = this.parser.parseLine(line, lineNumber);

        if (result.success) {
          batch.push(result.client);
        } else {
          this.stateManager.recordError(result.error);
        }

        if (batch.length >= BATCH_SIZE) {
          await this.flushBatch(batch);
          batch = [];

          if (lineNumber - lastProgressLog >= PROGRESS_LOG_INTERVAL) {
            this.logProgress();
            lastProgressLog = lineNumber;
          }
        }
      }

      if (batch.length > 0) {
        await this.flushBatch(batch);
        this.logProgress();
      }
    } finally {
      rl.close();
      fileStream.destroy();
    }
  }

  private async flushBatch(batch: Client[]): Promise<void> {
    this.stateManager.incrementBatch();
    const batchNumber = this.getState().currentBatch;

    try {
      await this.repository.insertMany(batch);
      this.stateManager.incrementInserted(batch.length);
      logger.debug({ batchNumber, size: batch.length }, 'Batch inserted');
    } catch (error) {
      logger.error(
        { batchNumber, size: batch.length, err: error },
        'Batch insert failed',
      );
      throw error;
    }
  }

  private logProgress(): void {
    const state = this.stateManager.getState();
    const metrics = getProcessMetrics();

    logger.info(
      {
        state: {
          linesRead: state.totalLinesRead,
          inserted: state.totalInserted,
          errors: state.totalErrors,
        },
        memory: {
          rssMB: metrics.memory.rss,
          heapUsedMB: metrics.memory.heapUsed,
        },
      },
      'Processing progress',
    );
  }
}
