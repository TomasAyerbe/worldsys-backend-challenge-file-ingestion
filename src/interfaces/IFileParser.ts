import { ParsedLine } from '../types/ParsedLine';

export interface IFileParser {
  parseLine(raw: string, lineNumber: number): ParsedLine;
}
