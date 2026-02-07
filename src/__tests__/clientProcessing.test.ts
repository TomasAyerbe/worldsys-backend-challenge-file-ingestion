import fs from 'fs';
import { Readable } from 'stream';
import { ClientStatus } from '../enums/ClientStatus';
import { ProcessingStatus } from '../enums/ProcessingStatus';
import { IClientRepository } from '../interfaces/IClientRepository';
import { Client } from '../models/Client';
import { ClientFileParser } from '../parsers/ClientFileParser';
import { ClientService } from '../services/ClientService';
import { ProcessingStateManager } from '../services/ProcessingStateManager';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
}));

jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const VALID_LINE = 'Alessandro|Leannon|29275795|Inactivo|7/15/2016|true|false';

const INVALID_LINE =
  'callide odio umquam catena terror subiungo talus aspernatur cotidie allatus cena admoneo adversus villa adhaero utrimque brevis ustilo ulterius angelus quaerat territo aestas varietas surgo sint spiritus degenero vis curso adulescens summa maiores umerus traho tempus ulciscor aeger aeger vetus assentator considero vehemens commemoro theologus ubi uredo xiphias amplexus damnatio|tertius viscus aetas adfero alo decumbo via ad aptus cervus thermae cibo nesciunt comedo adopto sumptus vomito statua commodi verto spiculum concedo aliqua dedecor statim vesica voro repellat tandem coerceo illo temeritas verumtamen coadunatio quia crebro amitto celebrer pectus coaegresco torrens suasoria absorbeo abbas via armarium adamo modi deludo super|28761078|Inactivo|8/31/2017|true|false';

describe('ClientService - full processing pipeline', () => {
  const parser = new ClientFileParser();
  let insertedClients: Client[];
  let mockRepository: IClientRepository;
  let stateManager: ProcessingStateManager;

  beforeEach(() => {
    insertedClients = [];
    mockRepository = {
      insertMany: jest.fn(async (clients: Client[]) => {
        insertedClients.push(...clients);
      }),
    };
    stateManager = new ProcessingStateManager();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.createReadStream as jest.Mock).mockReturnValue(
      Readable.from([VALID_LINE, INVALID_LINE].join('\n')),
    );
  });

  it('should process a file: insert valid users, detect invalid ones, and report correct totals', async () => {
    const service = new ClientService(mockRepository, parser, stateManager);

    service.startProcessing();
    await (service as any).processingPromise;

    const state = stateManager.getState();

    expect(state.status).toBe(ProcessingStatus.COMPLETED);
    expect(state.startedAt).toBeInstanceOf(Date);
    expect(state.finishedAt).toBeInstanceOf(Date);

    expect(state.totalLinesRead).toBe(2);

    expect(state.totalInserted).toBe(1);
    expect(insertedClients).toHaveLength(1);

    const inserted = insertedClients[0];
    expect(inserted.nombreCompleto).toBe('Alessandro Leannon');
    expect(inserted.dni).toBe(29275795);
    expect(inserted.estado).toBe(ClientStatus.INACTIVO);
    expect(inserted.fechaIngreso).toEqual(new Date(2016, 6, 15));
    expect(inserted.esPep).toBe(true);
    expect(inserted.esSujetoObligado).toBe(false);
    expect(inserted.fechaCreacion).toBeInstanceOf(Date);

    expect(state.totalErrors).toBe(1);
    expect(state.errors).toHaveLength(1);
    expect(state.errors[0].reason).toBe('Invalid nombreCompleto');
    expect(state.errors[0].line).toBe(2);
    expect(state.errors[0].raw).toBe(INVALID_LINE);

    expect(mockRepository.insertMany).toHaveBeenCalledTimes(1);
  });
});
