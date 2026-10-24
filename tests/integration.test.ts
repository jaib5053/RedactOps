import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processMasking, rehydrateResponse, createAuditCertificate } from '../src/engine/maskingEngine';
import { DEFAULT_RULES } from '../src/engine/regexRules';
import { SAMPLE_DATASETS } from '../src/engine/sampleDatasets';

describe('End-to-End System Integration Across Production Datasets', () => {
  it('Dataset 1 (Healthcare EHR): scrubs clinical markers and rehydrates LLM summary', async () => {
    const dataset = SAMPLE_DATASETS.find(d => d.id === 'healthcare')!;
    assert.ok(dataset, 'Healthcare dataset must exist');

    // 1. Sanitize
    const result = await processMasking(dataset.content, DEFAULT_RULES, 'token');

    // Verify key entities scrubbed
    assert.equal(result.sanitizedText.includes('123-45-6789'), false);
    assert.equal(result.sanitizedText.includes('jonathan.hastings@outlook.com'), false);
    assert.equal(result.sanitizedText.includes('(555) 382-9102'), false);
    assert.equal(result.sanitizedText.includes('MED-894102'), false);
    assert.equal(result.sanitizedText.includes('742 Evergreen Terrace'), false);

    // Verify entities detected
    assert.ok(result.entities.length >= 5);
    assert.ok(result.stats.breakdownByCategory.health > 0);
    assert.ok(result.stats.breakdownByCategory.personal > 0);

    // 2. Simulate AI response using generated tokens
    const aiResponse = `Clinical Summary:
Patient: [PERSON_1]
Contact: [EMAIL_1]
MRN Identifier: [MRN_1]
Discharge Plan: Follow up scheduled for [PERSON_1].`;

    // 3. Rehydrate
    const rehydrated = rehydrateResponse(aiResponse, result.tokenMap);

    assert.ok(rehydrated.restoredText.includes('Jonathan Hastings'));
    assert.ok(rehydrated.restoredText.includes('jonathan.hastings@outlook.com'));
    assert.ok(rehydrated.restoredText.includes('MED-894102'));
    assert.equal(rehydrated.restoredCount, 4); // 2 persons, 1 email, 1 MRN

    // 4. Audit Certificate
    const cert = await createAuditCertificate(result);
    assert.equal(cert.entitiesScrubbedCount, result.entities.length);
    assert.equal(cert.zeroKnowledgeAttestation, true);
  });

  it('Dataset 2 (Financial M&A): scrubs IBANs, Credit Cards, and C-Suite context', async () => {
    const dataset = SAMPLE_DATASETS.find(d => d.id === 'financial')!;
    assert.ok(dataset, 'Financial dataset must exist');

    const result = await processMasking(dataset.content, DEFAULT_RULES, 'token');

    // Credit cards scrubbed
    assert.equal(result.sanitizedText.includes('4532-1234-5678-9012'), false);
    assert.equal(result.sanitizedText.includes('5105-1051-0510-5100'), false);
    // IBAN scrubbed
    assert.equal(result.sanitizedText.includes('GB29 NWBK 6016 1331 9268 19'), false);
    // SSN scrubbed
    assert.equal(result.sanitizedText.includes('451-92-3819'), false);

    assert.ok(result.stats.breakdownByCategory.financial >= 3);

    // Simulated LLM wire authorization
    const aiResponse = 'Authorized wire from [IBAN_1] for account held by [PERSON_1].';
    const rehydrated = rehydrateResponse(aiResponse, result.tokenMap);
    assert.ok(rehydrated.restoredText.includes('GB29 NWBK 6016 1331 9268 19'));
  });

  it('Dataset 3 (DevOps Incident Logs): scrubs API keys, JWT tokens, and internal IPv4s', async () => {
    const dataset = SAMPLE_DATASETS.find(d => d.id === 'technical')!;
    assert.ok(dataset, 'Technical dataset must exist');

    const result = await processMasking(dataset.content, DEFAULT_RULES, 'token');

    // Secrets scrubbed
    assert.equal(result.sanitizedText.includes('ghp_MockGitHubPersonalAccessToken36Chars'), false);
    assert.equal(result.sanitizedText.includes('AKIAIOSFODNN7EXAMPLE'), false);
    assert.equal(result.sanitizedText.includes('sk-ant-api03-Kx98234'), false);
    assert.equal(result.sanitizedText.includes('192.168.1.45'), false);
    assert.equal(result.sanitizedText.includes('172.16.254.1'), false);

    assert.ok(result.stats.breakdownByCategory.technical >= 4);

    const cert = await createAuditCertificate(result);
    assert.ok(cert.entitiesScrubbedCount >= 5);
  });

  it('Dataset 4 (Legal Deposition): scrubs witness identities and physical addresses', async () => {
    const dataset = SAMPLE_DATASETS.find(d => d.id === 'legal')!;
    assert.ok(dataset, 'Legal dataset must exist');

    const result = await processMasking(dataset.content, DEFAULT_RULES, 'token');

    // Address and email scrubbed
    assert.equal(result.sanitizedText.includes('1440 Ocean Parkway'), false);
    assert.equal(result.sanitizedText.includes('david.steinberg@apexpharma-corp.com'), false);
    assert.equal(result.sanitizedText.includes('092-41-8821'), false);

    assert.ok(result.entities.length >= 4);
  });
});
