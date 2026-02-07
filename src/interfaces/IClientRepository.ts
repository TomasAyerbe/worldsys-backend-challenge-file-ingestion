import { Client } from '../models/Client';

export interface IClientRepository {
  insertMany(clients: Client[]): Promise<void>;
}
