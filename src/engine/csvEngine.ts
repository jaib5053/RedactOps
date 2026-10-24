import { EntityRule, MaskingMode, DetectedEntity, MaskingResult } from '../types';
import { processMasking } from './maskingEngine';

export interface CsvCleanResult {
  sanitizedCsv: string;
  originalRows: string[][];
  cleanedRows: string[][];
  totalEntitiesFound: number;
  entities: DetectedEntity[];
  tokenMap: Record<string, string>;
  headerRow: string[];
}

/**
 * RFC 4180-compliant CSV Parser.
 * Properly handles quoted fields, escaped quotes (""), embedded commas, and CRLF / LF newlines.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i += 2;
      } else if (char === '"') {
        inQuotes = false;
        i++;
      } else {
        currentCell += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i += 2;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else {
        currentCell += char;
        i++;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter(r => r.length > 0 && !(r.length === 1 && r[0] === ''));
}

/**
 * RFC 4180-compliant CSV Stringifier.
 * Quotes cells that contain commas, double quotes, or newlines, and escapes quotes.
 */
export function stringifyCsv(rows: string[][]): string {
  return rows.map(row =>
    row.map(cell => {
      const needsQuotes = cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
      if (needsQuotes) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
}

/**
 * Redacts CSV data cell-by-cell, preserving column structure, quotes, and header row.
 * Intelligently recognizes designated Name columns for full PII de-identification.
 */
export async function processCsvMasking(
  csvText: string,
  rules: EntityRule[],
  mode: MaskingMode = 'token',
  options: { skipHeader?: boolean } = { skipHeader: true }
): Promise<CsvCleanResult> {
  const originalRows = parseCsv(csvText);
  if (originalRows.length === 0) {
    return {
      sanitizedCsv: '',
      originalRows: [],
      cleanedRows: [],
      totalEntitiesFound: 0,
      entities: [],
      tokenMap: {},
      headerRow: []
    };
  }

  const headerRow = options.skipHeader ? originalRows[0] : [];
  const startRowIdx = options.skipHeader ? 1 : 0;
  const cleanedRows: string[][] = options.skipHeader ? [[...originalRows[0]]] : [];

  const allEntities: DetectedEntity[] = [];
  const combinedTokenMap: Record<string, string> = {};
  const personReverseMap: Record<string, string> = {};
  let personCounter = 0;

  // Identify column indices that correspond to person names
  const nameColIndices = new Set<number>();
  if (options.skipHeader && originalRows.length > 0) {
    originalRows[0].forEach((col, idx) => {
      const isNameHeader =
        /(?:^|[_\s])(?:full[_-]?name|name|patient|client|customer|physician|doctor|employee|witness|contact)(?:$|[_\s])/i.test(col) &&
        !/(?:id|num|code|hash|ssn|date)/i.test(col);
      if (isNameHeader) {
        nameColIndices.add(idx);
      }
    });
  }

  for (let r = startRowIdx; r < originalRows.length; r++) {
    const row = originalRows[r];
    const cleanedRow: string[] = [];

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) {
        cleanedRow.push('');
        continue;
      }

      // Check if designated person name column and cell contains a name
      if (nameColIndices.has(c) && /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(cell.trim())) {
        const rawName = cell.trim();
        let maskedVal = '';
        if (mode === 'token') {
          if (personReverseMap[rawName]) {
            maskedVal = personReverseMap[rawName];
          } else {
            personCounter++;
            maskedVal = `[PERSON_${personCounter}]`;
            personReverseMap[rawName] = maskedVal;
            combinedTokenMap[maskedVal] = rawName;
          }
        } else if (mode === 'redacted') {
          personCounter++;
          maskedVal = `[REDACTED_PERSON_${personCounter}]`;
          combinedTokenMap[maskedVal] = rawName;
        } else if (mode === 'synthetic') {
          personCounter++;
          maskedVal = `Sample Patient ${personCounter}`;
          combinedTokenMap[maskedVal] = rawName;
        } else if (mode === 'scramble') {
          maskedVal = rawName.replace(/[a-zA-Z]/g, 'X');
          combinedTokenMap[maskedVal] = rawName;
        }

        cleanedRow.push(maskedVal);
        allEntities.push({
          id: `entity-csv-${r}-${c}`,
          ruleId: 'names_contextual',
          category: 'personal',
          type: 'Full Name (Column Aware)',
          rawText: rawName,
          maskedText: maskedVal,
          startIndex: 0,
          endIndex: rawName.length
        });
        continue;
      }

      const result: MaskingResult = await processMasking(cell, rules, mode);
      cleanedRow.push(result.sanitizedText);
      allEntities.push(...result.entities);
      Object.assign(combinedTokenMap, result.tokenMap);
    }

    cleanedRows.push(cleanedRow);
  }

  const sanitizedCsv = stringifyCsv(cleanedRows);

  return {
    sanitizedCsv,
    originalRows,
    cleanedRows,
    totalEntitiesFound: allEntities.length,
    entities: allEntities,
    tokenMap: combinedTokenMap,
    headerRow
  };
}
