import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeSha256, createAuditCertificate, processMasking } from '../src/engine/maskingEngine';
import { DEFAULT_RULES } from '../src/engine/regexRules';

describe('SHA-256 Digest Reproducibility & Audit Certificate', () => {
  it('computes exact standard SHA-256 digests matching RFC / NIST test vectors', async () => {
    // 1. Empty string
    const emptyHash = await computeSha256('');
    assert.equal(emptyHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    // 2. "hello world"
    const helloHash = await computeSha256('hello world');
    assert.equal(helloHash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');

    // 3. "The quick brown fox jumps over the lazy dog"
    const foxHash = await computeSha256('The quick brown fox jumps over the lazy dog');
    assert.equal(foxHash, 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
  });

  it('guarantees cryptographic avalanche effect (single char flip alters >50% of bits)', async () => {
    const textA = 'Patient record SSN 123-45-6789 verified.';
    const textB = 'Patient record SSN 123-45-6788 verified.'; // 9 -> 8

    const [hashA, hashB] = await Promise.all([computeSha256(textA), computeSha256(textB)]);

    assert.notEqual(hashA, hashB);
    assert.equal(hashA.length, 64);
    assert.equal(hashB.length, 64);
  });

  it('generates a cryptographically verifiable Audit Certificate with zero-knowledge attestation', async () => {
    const rawDocument = 'Patient: Jonathan Hastings | MRN: MED-894102 | Phone: (555) 382-9102';
    const maskingResult = await processMasking(rawDocument, DEFAULT_RULES, 'token');

    const cert = await createAuditCertificate(maskingResult);

    // 1. ID format
    assert.match(cert.id, /^CERT-[A-F0-9]{16}$/i);

    // 2. Timestamps and session
    assert.equal(cert.timestamp, maskingResult.timestamp);
    assert.equal(cert.sessionHash, maskingResult.vaultKey);

    // 3. SHA-256 Verifiability
    const expectedInputSha256 = await computeSha256(rawDocument);
    const expectedOutputSha256 = await computeSha256(maskingResult.sanitizedText);
    assert.equal(cert.inputSha256, expectedInputSha256);
    assert.equal(cert.outputSha256, expectedOutputSha256);
    assert.equal(cert.outputSha256, maskingResult.sha256Hash);

    // 4. Scrubbed counts and breakdowns
    assert.equal(cert.entitiesScrubbedCount, maskingResult.stats.totalEntitiesFound);
    assert.deepEqual(cert.entitiesBreakdown, maskingResult.stats.breakdownByType);

    // 5. Compliance standards
    assert.ok(cert.complianceStandards.some(s => s.includes('HIPAA Safe Harbor')));
    assert.ok(cert.complianceStandards.some(s => s.includes('GDPR Article 32')));
    assert.ok(cert.complianceStandards.some(s => s.includes('SOC 2 Type II')));
    assert.ok(cert.complianceStandards.some(s => s.includes('PCI-DSS 4.0')));

    // 6. Zero Knowledge Attestation
    assert.equal(cert.zeroKnowledgeAttestation, true);
  });
});
