import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processMasking } from '../src/engine/maskingEngine';
import { DEFAULT_RULES, SYNTHETIC_VALUES } from '../src/engine/regexRules';

describe('Masking Modes and Stats Reporting', () => {
  const sampleText = `User Alex Rivera (email: alex.rivera@meridian-health.org, phone: (555) 382-9102) has SSN 123-45-6789.
Please contact alex.rivera@meridian-health.org again regarding card 4532-1234-5678-9012.`;

  it('Mode 1: "token" generates indexed tokens and re-uses identical tokens for repeated values', async () => {
    const result = await processMasking(sampleText, DEFAULT_RULES, 'token');

    assert.ok(result.sanitizedText.includes('[EMAIL_1]'));
    assert.ok(result.sanitizedText.includes('[PHONE_1]'));
    assert.ok(result.sanitizedText.includes('[SSN_1]'));
    assert.ok(result.sanitizedText.includes('[CARD_1]'));

    // The email appears twice in sampleText. It must use [EMAIL_1] both times!
    const emailOccurrences = (result.sanitizedText.match(/\[EMAIL_1\]/g) || []).length;
    assert.equal(emailOccurrences, 2, 'Identical email must reuse [EMAIL_1]');

    // Ensure [EMAIL_2] was not generated because identical value was reused
    assert.equal(result.sanitizedText.includes('[EMAIL_2]'), false);

    // Verify tokenMap
    assert.equal(result.tokenMap['[EMAIL_1]'], 'alex.rivera@meridian-health.org');
    assert.equal(result.tokenMap['[SSN_1]'], '123-45-6789');
    assert.equal(result.tokenMap['[CARD_1]'], '4532-1234-5678-9012');
  });

  it('Mode 2: "redacted" masks all entities with explicit [REDACTED_PREFIX_X] markers', async () => {
    const result = await processMasking(sampleText, DEFAULT_RULES, 'redacted');

    assert.ok(result.sanitizedText.includes('[REDACTED_EMAIL_1]'));
    assert.ok(result.sanitizedText.includes('[REDACTED_PHONE_1]'));
    assert.ok(result.sanitizedText.includes('[REDACTED_SSN_1]'));
    assert.ok(result.sanitizedText.includes('[REDACTED_CARD_1]'));

    // Zero raw PII in output
    assert.equal(result.sanitizedText.includes('123-45-6789'), false);
    assert.equal(result.sanitizedText.includes('4532-1234-5678-9012'), false);
    assert.equal(result.sanitizedText.includes('alex.rivera@meridian-health.org'), false);
  });

  it('Mode 3: "synthetic" replaces entities with realistic synthetic values from defined pool', async () => {
    const result = await processMasking(sampleText, DEFAULT_RULES, 'synthetic');

    // Email should be replaced by a value in SYNTHETIC_VALUES.EMAIL
    const emailPool = SYNTHETIC_VALUES.EMAIL;
    const foundEmail = emailPool.some(val => result.sanitizedText.includes(val));
    assert.ok(foundEmail, 'Sanitized text should contain synthetic email from pool');

    // Phone should be replaced by a value in SYNTHETIC_VALUES.PHONE
    const phonePool = SYNTHETIC_VALUES.PHONE;
    const foundPhone = phonePool.some(val => result.sanitizedText.includes(val));
    assert.ok(foundPhone, 'Sanitized text should contain synthetic phone from pool');

    // Raw PII scrubbed
    assert.equal(result.sanitizedText.includes('123-45-6789'), false);
    assert.equal(result.sanitizedText.includes('(555) 382-9102'), false);
  });

  it('Mode 4: "scramble" replaces letters with X and digits with 9 while preserving punctuation and length', async () => {
    const text = 'SSN: 123-45-6789, Phone: (555) 382-9102';
    const result = await processMasking(text, DEFAULT_RULES, 'scramble');

    // SSN 123-45-6789 -> 999-99-9999 (length 11 preserved, hyphens preserved)
    assert.ok(result.sanitizedText.includes('999-99-9999'));

    // Phone (555) 382-9102 -> (999) 999-9999 (parentheses, space, hyphen preserved)
    assert.ok(result.sanitizedText.includes('(999) 999-9999'));
  });

  it('computes accurate entity statistics, category breakdowns, and byte sizes', async () => {
    const result = await processMasking(sampleText, DEFAULT_RULES, 'token');

    assert.equal(result.stats.totalEntitiesFound, 5); // 2 emails, 1 phone, 1 SSN, 1 CC
    assert.equal(result.stats.breakdownByCategory.personal, 4); // 2 emails + 1 phone + 1 SSN
    assert.equal(result.stats.breakdownByCategory.financial, 1); // 1 CC
    assert.equal(result.stats.breakdownByType['Email Addresses'], 2);
    assert.equal(result.stats.breakdownByType['Credit Card Numbers'], 1);

    // Byte sizes must be positive integers
    assert.ok(result.stats.originalByteSize > 0);
    assert.ok(result.stats.sanitizedByteSize > 0);
    assert.ok(result.stats.processingTimeMs >= 0);

    // SHA-256 hash must be valid 64-char hex string
    assert.match(result.sha256Hash, /^[0-9a-f]{64}$/);
    assert.match(result.vaultKey, /^vk_/);
  });
});
