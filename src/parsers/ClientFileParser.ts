import { ClientStatus } from '../enums/ClientStatus';
import { IFileParser } from '../interfaces/IFileParser';
import { Client } from '../models/Client';
import { ParsedLine } from '../types/ParsedLine';

const EXPECTED_FIELDS = 7;
const MAX_NAME_LENGTH = 100;

export class ClientFileParser implements IFileParser {
  parseLine(raw: string, lineNumber: number): ParsedLine {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return this.failure(lineNumber, raw, 'Empty line');
    }

    const parts = trimmed.split('|');
    if (parts.length !== EXPECTED_FIELDS) {
      return this.failure(lineNumber, trimmed, 'Invalid number of fields');
    }

    const [
      nombre,
      apellido,
      dniStr,
      estadoStr,
      fechaStr,
      esPepStr,
      esSujetoStr,
    ] = parts;

    const nombreCompleto = `${nombre} ${apellido}`.trim();
    if (
      nombreCompleto.length === 0 ||
      nombreCompleto.length > MAX_NAME_LENGTH
    ) {
      return this.failure(lineNumber, trimmed, 'Invalid nombreCompleto');
    }

    const dni = Number(dniStr);
    if (!Number.isInteger(dni) || dni <= 0) {
      return this.failure(lineNumber, trimmed, 'Invalid DNI');
    }

    const estado = estadoStr as ClientStatus;
    if (estado !== ClientStatus.ACTIVO && estado !== ClientStatus.INACTIVO) {
      return this.failure(lineNumber, trimmed, 'Invalid estado');
    }

    const fechaIngreso = this.parseDate(fechaStr);
    if (fechaIngreso === null) {
      return this.failure(lineNumber, trimmed, 'Invalid fechaIngreso');
    }

    const esPep = this.parseBoolean(esPepStr);
    if (esPep === null) {
      return this.failure(lineNumber, trimmed, 'Invalid esPep');
    }

    const esSujetoObligado =
      esSujetoStr === '' ? null : this.parseBoolean(esSujetoStr);
    if (esSujetoStr !== '' && esSujetoObligado === null) {
      return this.failure(lineNumber, trimmed, 'Invalid esSujetoObligado');
    }

    const fechaCreacion = new Date();

    const client: Client = {
      nombreCompleto,
      dni,
      estado,
      fechaIngreso,
      esPep,
      esSujetoObligado,
      fechaCreacion,
    };

    return { success: true, client };
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;

    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900)
      return null;

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private parseBoolean(value: string): boolean | null {
    const lower = value.toLowerCase().trim();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return null;
  }

  private failure(line: number, raw: string, reason: string): ParsedLine {
    return { success: false, error: { line, raw, reason } };
  }
}
