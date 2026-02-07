import { Static, Type } from '@sinclair/typebox';
import { ClientStatus } from '../enums/ClientStatus';

export const ClientSchema = Type.Object({
  nombreCompleto: Type.String({ minLength: 1, maxLength: 100 }),
  dni: Type.Integer({ exclusiveMinimum: 0 }),
  estado: Type.Enum(ClientStatus),
  fechaIngreso: Type.Date(),
  esPep: Type.Boolean(),
  esSujetoObligado: Type.Union([Type.Boolean(), Type.Null()]),
  fechaCreacion: Type.Date(),
});

export type Client = Static<typeof ClientSchema>;
