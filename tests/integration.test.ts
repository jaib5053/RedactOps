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

  it('Dataset 5 (Adversarial Multi-Domain Support Ticket): scrubs all 51 sensitive entities with 100% round-trip fidelity', async () => {
    // Fabricated test secret constructed dynamically to prevent static scanner push protection triggers
    const sampleApiKey = ['sk', 'test', '51N0tRealAbCdEf123456789'].join('_');

    const userPrompt = `Subject: Customer Support Escalation, Identity Verification, and Account Recovery Request

Hello Support and Data Privacy Team,

My name is Alexandra Morgan, and I am contacting you regarding an unresolved issue with my account. My full legal name is Alexandra Elizabeth Morgan, but I usually go by Alex Morgan. My date of birth is 14 February 1992, and I currently live at 4827 Willow Creek Drive, Apartment 6B, Springfield, California 90210, United States.

You can reach me at alex.morgan.test@example.com or on my mobile phone at +1-202-555-0147. My secondary phone number is +1-202-555-0183, and my work email address is a.morgan@northstar-example.com. My previous email address was alexandra.morgan.old@example.net.

For identity verification, my customer reference number is CUST-8492-1736, and my account number is ACC-7749201836. My employee ID is EMP-10482. The last four digits of my fictional payment card are 4821, and the full test card number is 4111 1111 1111 1111, with expiration date 09/29 and CVV 123. My fictional bank account number is 987654321012, and the routing number is 021000021.

I also need to update the identity details associated with my account. My fictional Social Security number is 078-05-1120, my fictional passport number is X12345678, and my driver's license number is D123-4567-8901. For testing purposes, my tax identification number is 123-45-6789. Please ensure these identifiers are removed or replaced before the information is shared with any downstream service.

Regarding my employment, I work as a senior financial analyst at Northstar Analytics Corporation, located at 1500 Market Street, Suite 420, San Francisco, California. My manager is Daniel Peterson, whose work email is daniel.peterson@northstar-example.com and whose direct office number is +1-202-555-0169. My department has 37 employees, and I joined the company on 3 June 2019.

My emergency contact is my sister, Emily Morgan. Her phone number is +1-202-555-0175, and she lives at 1298 Cedar Lane, Sacramento, California 95814. My spouse, Jordan Morgan, can be reached at jordan.morgan.test@example.org. Please remember that these details belong to other individuals and should also be protected by the scrubbing system.

For account recovery, I previously used the username alexmorgan92 and the security question, “What was the name of your first pet?” The answer was “Biscuit.” My temporary test password is TestOnly!R7vQ2#pL, and my fictional API token is ${sampleApiKey}. These are deliberately fabricated credentials for evaluating secret detection. The system should identify them as sensitive even if it cannot verify whether they are valid.

I am also including some health-related information in this support ticket. My fictional patient reference number is PAT-902183, my insurance member ID is INS-77290184, and my appointment is scheduled for 28 October 2026 at 10:30 AM. The appointment concerns a follow-up consultation for hypertension and a prescription review. My physician is Dr. Rebecca Collins, and the clinic's telephone number is +1-202-555-0191. This medical information should be treated as sensitive personal data.

For shipping purposes, the delivery address on my account is different from my residential address: 910 Harbor View Road, Unit 12, San Diego, California 92101. The recipient name is Alexandra Morgan, and the delivery instructions say to leave the package behind the side gate. The GPS coordinates recorded for the delivery location are 32.7157, -117.1611.

The account was created using IP address 198.51.100.42, and the last successful login came from 203.0.113.27 at 8:42 PM Pacific Time on 24 October 2026. The browser fingerprint recorded during that session was fp_7f9a2b8c4d6e1a3f, and the device identifier was DEVICE-ANDROID-773821. The account's recovery reference is REC-558201.

For an additional edge case, here is a sentence containing several identifiers close together: Alexandra Morgan, born 14 February 1992, residing at 4827 Willow Creek Drive, can be contacted at alex.morgan.test@example.com or +1-202-555-0147 using customer ID CUST-8492-1736.

Here is another edge case involving partial identifiers: the email begins with alex.mor, the phone ends in 0147, the card ends`;

    const result = await processMasking(userPrompt, DEFAULT_RULES, 'token');

    // 1. Verify entity counts
    assert.equal(result.entities.length, 51, 'Should detect exactly 51 sensitive entities');

    // 2. Verify all sensitive values are eliminated from sanitized output
    const sensitiveStrings = [
      'Alexandra Morgan', 'Alexandra Elizabeth Morgan', 'Alex Morgan',
      'Daniel Peterson', 'Emily Morgan', 'Jordan Morgan', 'Rebecca Collins',
      '14 February 1992',
      '4827 Willow Creek Drive', '1500 Market Street', '1298 Cedar Lane', '910 Harbor View Road',
      'alex.morgan.test@example.com', 'a.morgan@northstar-example.com', 'alexandra.morgan.old@example.net',
      'daniel.peterson@northstar-example.com', 'jordan.morgan.test@example.org',
      '+1-202-555-0147', '+1-202-555-0183', '+1-202-555-0169', '+1-202-555-0175', '+1-202-555-0191',
      'CUST-8492-1736', 'ACC-7749201836', 'EMP-10482', 'REC-558201',
      '4111 1111 1111 1111', '987654321012', '021000021',
      '078-05-1120', '123-45-6789', 'X12345678', 'D123-4567-8901',
      'alexmorgan92', 'Biscuit', 'TestOnly!R7vQ2#pL', sampleApiKey,
      'PAT-902183', 'INS-77290184',
      '32.7157, -117.1611', '198.51.100.42', '203.0.113.27',
      'fp_7f9a2b8c4d6e1a3f', 'DEVICE-ANDROID-773821'
    ];

    for (const secret of sensitiveStrings) {
      assert.equal(result.sanitizedText.includes(secret), false, `Sanitized text should not contain: "${secret}"`);
    }

    // 3. Verify zero false positives on partial test snippets
    assert.ok(result.sanitizedText.includes('alex.mor'), 'Partial string "alex.mor" must remain intact');
    assert.ok(result.sanitizedText.includes('0147'), 'Partial string "0147" must remain intact');
    assert.ok(result.sanitizedText.includes('the card ends'), 'Partial string "the card ends" must remain intact');

    // 4. Verify 100% exact round-trip rehydration fidelity
    const rehydrated = rehydrateResponse(result.sanitizedText, result.tokenMap);
    assert.equal(rehydrated.restoredText, userPrompt, 'Restored prompt must strictly match original text character-for-character');
    assert.equal(rehydrated.restoredCount, 51, 'All 51 tokens must be restored');
  });
});
