import {
  BigInt,
  Bit,
  ConnectionPool,
  Date,
  DateTime,
  NVarChar,
  Request,
  Table,
  VarChar,
} from 'mssql';
import { IClientRepository } from '../interfaces/IClientRepository';
import { Client } from '../models/Client';

export class ClientRepository implements IClientRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  private createClientsTable(): Table {
    const table = new Table('clients');

    table.columns.add('NombreCompleto', NVarChar(100), {
      nullable: false,
    });
    table.columns.add('DNI', BigInt, { nullable: false });
    table.columns.add('Estado', VarChar(10), { nullable: false });
    table.columns.add('FechaIngreso', Date, { nullable: false });
    table.columns.add('EsPEP', Bit, { nullable: false });
    table.columns.add('EsSujetoObligado', Bit, { nullable: true });
    table.columns.add('FechaCreacion', DateTime, { nullable: false });

    return table;
  }

  async insertMany(clients: Client[]): Promise<void> {
    const table = this.createClientsTable();

    clients.forEach((client) => {
      table.rows.add(
        client.nombreCompleto,
        client.dni,
        client.estado,
        client.fechaIngreso,
        client.esPep,
        client.esSujetoObligado,
        client.fechaCreacion,
      );
    });

    const pool = await this.getPool();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const request = new Request(transaction);
      await request.bulk(table);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
