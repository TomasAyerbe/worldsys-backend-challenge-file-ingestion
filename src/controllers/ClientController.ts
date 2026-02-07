import { Request, Response } from 'express';
import { HttpStatusCodes } from '../enums/HttpStatusCodes';
import { IClientService } from '../interfaces/IClientService';

export class ClientController {
  constructor(private readonly clientService: IClientService) {}

  startIngestion = (_req: Request, res: Response): void => {
    this.clientService.startProcessing();

    res.status(HttpStatusCodes.ACCEPTED).json({
      message: 'File processing started',
    });
  };

  getStatus = (_req: Request, res: Response): void => {
    const state = this.clientService.getState();
    res.status(HttpStatusCodes.OK).json(state);
  };
}
