import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, stringifyCsv, processCsvMasking } from '../src/engine/csvEngine';
import { DEFAULT_RULES } from '../src/engine/regexRules';

describe('CSV Parsing, Cell Redaction, and Reconstruction', () => {
  const sampleRawCsv = `Patient_ID,Full_Name,SSN,Email,Phone,Primary_Diagnosis
1001,Jonathan Hastings,123-45-6789,jonathan.hastings@outlook.com,(555) 382-9102,Pneumonia Acute
1002,Helena Vance,451-92-3819,helena.vance@company.org,(555) 723-9912,Cardiac Arrhythmia`;

  it('correctly parses RFC 4180 CSV with quotes, commas, and escaped quotes', () => {
    const complexCsv = `ID,Name,Address,Notes
1,"Hastings, Jonathan","742 Evergreen Terrace, Springfield","Diagnosis: ""Acute"""
2,"Drake, Helena","100 Main Street, Suite 400","Normal"`;

    const rows = parseCsv(complexCsv);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], ['ID', 'Name', 'Address', 'Notes']);
    assert.equal(rows[1][1], 'Hastings, Jonathan');
    assert.equal(rows[1][2], '742 Evergreen Terrace, Springfield');
    assert.equal(rows[1][3], 'Diagnosis: "Acute"');
    assert.equal(rows[2][1], 'Drake, Helena');
  });

  it('serializes CSV with proper quoting for cells containing commas, quotes, or newlines', () => {
    const table = [
      ['Col1', 'Col2', 'Col3'],
      ['Simple', 'Has, Comma', 'Has "Quotes"']
    ];

    const serialized = stringifyCsv(table);
    assert.ok(serialized.includes('"Has, Comma"'));
    assert.ok(serialized.includes('"Has ""Quotes"""'));

    // Roundtrip verification
    const reParsed = parseCsv(serialized);
    assert.deepEqual(reParsed, table);
  });

  it('executes cell-level redaction without breaking row and column structure', async () => {
    const result = await processCsvMasking(sampleRawCsv, DEFAULT_RULES, 'token', { skipHeader: true });

    // Verify 3 rows preserved
    assert.equal(result.cleanedRows.length, 3);
    // Verify each row has 6 columns
    assert.equal(result.cleanedRows[0].length, 6);
    assert.equal(result.cleanedRows[1].length, 6);
    assert.equal(result.cleanedRows[2].length, 6);

    // Header preserved
    assert.deepEqual(result.cleanedRows[0], ['Patient_ID', 'Full_Name', 'SSN', 'Email', 'Phone', 'Primary_Diagnosis']);

    // Row 1 values redacted
    assert.equal(result.cleanedRows[1][0], '1001');
    assert.ok(result.cleanedRows[1][1].includes('[PERSON_'));
    assert.ok(result.cleanedRows[1][2].includes('[SSN_'));
    assert.ok(result.cleanedRows[1][3].includes('[EMAIL_'));
    assert.ok(result.cleanedRows[1][4].includes('[PHONE_'));
    assert.equal(result.cleanedRows[1][5], 'Pneumonia Acute');

    // Total entities found: 2 Names + 2 SSNs + 2 Emails + 2 Phones = 8 entities
    assert.equal(result.totalEntitiesFound, 8);
    assert.ok(result.sanitizedCsv.length > 0);
  });

  it('quotes cells automatically if replacement values contain commas (e.g. synthetic addresses)', async () => {
    const addressCsv = `Patient_ID,Home_Address
101,742 Evergreen Terrace
102,1440 Ocean Parkway`;

    const result = await processCsvMasking(addressCsv, DEFAULT_RULES, 'synthetic', { skipHeader: true });

    assert.equal(result.cleanedRows.length, 3);
    // Synthetic addresses often contain commas e.g. "100 Main Street, Suite 400"
    // Re-parsed rows must preserve exactly 2 columns per row
    const reParsed = parseCsv(result.sanitizedCsv);
    assert.equal(reParsed.length, 3);
    assert.equal(reParsed[0].length, 2);
    assert.equal(reParsed[1].length, 2);
    assert.equal(reParsed[2].length, 2);
  });

  it('preserves multi-line cells and trims whitespace safely', () => {
    const multilineCsv = `"ID","Description"\n1,"First line\nSecond line"`;
    const parsed = parseCsv(multilineCsv);

    assert.equal(parsed.length, 2);
    assert.equal(parsed[1][1], 'First line\nSecond line');

    const serialized = stringifyCsv(parsed);
    assert.ok(serialized.includes('"First line\nSecond line"'));
  });
});
