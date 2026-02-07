import { getPool } from './config/database';
import { ClientController } from './controllers/ClientController';
import { ClientFileParser } from './parsers/ClientFileParser';
import { ClientRepository } from './repositories/ClientRepository';
import { ClientService } from './services/ClientService';
import { ProcessingStateManager } from './services/ProcessingStateManager';

const clientRepository = new ClientRepository(getPool);
const clientFileParser = new ClientFileParser();
const processingStateManager = new ProcessingStateManager();

export const clientService = new ClientService(
  clientRepository,
  clientFileParser,
  processingStateManager,
);

export const clientController = new ClientController(clientService);
