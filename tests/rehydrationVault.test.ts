import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rehydrateResponse } from '../src/engine/maskingEngine';

describe('Rehydration Vault (rehydrateResponse)', () => {
  const tokenMap: Record<string, string> = {
    '[PERSON_1]': 'Jonathan Hastings',
    '[EMAIL_1]': 'jonathan.hastings@outlook.com',
    '[PHONE_1]': '(555) 382-9102',
    '[CARD_1]': '4532-1234-5678-9012',
    '[UNMATCHED_1]': 'Unused Entity'
  };

  it('restores single and multiple distinct tokens correctly', () => {
    const aiResponse = 'Patient identity verified as [PERSON_1]. Contact at [EMAIL_1] or [PHONE_1].';
    const result = rehydrateResponse(aiResponse, tokenMap);

    assert.equal(
      result.restoredText,
      'Patient identity verified as Jonathan Hastings. Contact at jonathan.hastings@outlook.com or (555) 382-9102.'
    );
    assert.equal(result.restoredCount, 3);
    assert.ok(result.matchedTokens.includes('[PERSON_1]'));
    assert.ok(result.matchedTokens.includes('[EMAIL_1]'));
    assert.ok(result.matchedTokens.includes('[PHONE_1]'));
  });

  it('restores identical duplicate tokens across AI responses and counts all replacements', () => {
    const aiResponse = 'Dr. review: [PERSON_1] was admitted on Monday. The discharge plan for [PERSON_1] is complete. Follow up with [PERSON_1] in 14 days.';
    const result = rehydrateResponse(aiResponse, tokenMap);

    assert.equal(
      result.restoredText,
      'Dr. review: Jonathan Hastings was admitted on Monday. The discharge plan for Jonathan Hastings is complete. Follow up with Jonathan Hastings in 14 days.'
    );
    assert.equal(result.restoredCount, 3);
    assert.deepEqual(result.matchedTokens, ['[PERSON_1]']);
  });

  it('handles markdown bold, italics, and backticks around tokens', () => {
    const aiResponse = 'Assessment for **[PERSON_1]** and *[EMAIL_1]*; code: `[CARD_1]`.';
    const result = rehydrateResponse(aiResponse, tokenMap);

    assert.equal(
      result.restoredText,
      'Assessment for **Jonathan Hastings** and *jonathan.hastings@outlook.com*; code: `4532-1234-5678-9012`.'
    );
    assert.equal(result.restoredCount, 3);
  });

  it('handles markdown formatting placed inside token brackets by LLMs (e.g. [**TOKEN**])', () => {
    const aiResponse = 'Summary: [**PERSON_1**] has verified contact [*EMAIL_1*].';
    const result = rehydrateResponse(aiResponse, tokenMap);

    assert.equal(
      result.restoredText,
      'Summary: Jonathan Hastings has verified contact jonathan.hastings@outlook.com.'
    );
    assert.equal(result.restoredCount, 2);
    assert.ok(result.matchedTokens.includes('[PERSON_1]'));
    assert.ok(result.matchedTokens.includes('[EMAIL_1]'));
  });

  it('handles surrounding double brackets, parentheses, colons, and punctuation', () => {
    const aiResponse = 'Record ([[PERSON_1]]) -> ([EMAIL_1]): status [CARD_1]!';
    const result = rehydrateResponse(aiResponse, tokenMap);

    assert.equal(
      result.restoredText,
      'Record ([Jonathan Hastings]) -> (jonathan.hastings@outlook.com): status 4532-1234-5678-9012!'
    );
    assert.equal(result.restoredCount, 3);
  });

  it('handles unmatched tokens gracefully without modifying text or falsely counting', () => {
    const aiResponse = 'This response only mentions [PERSON_1].';
    const result = rehydrateResponse(aiResponse, tokenMap);

    assert.equal(result.restoredText, 'This response only mentions Jonathan Hastings.');
    assert.equal(result.restoredCount, 1);
    assert.equal(result.matchedTokens.includes('[UNMATCHED_1]'), false);
    assert.equal(result.matchedTokens.includes('[EMAIL_1]'), false);
  });

  it('handles text with no tokens or empty tokenMap', () => {
    const noTokenResponse = 'Standard AI response with no masked tokens.';
    const r1 = rehydrateResponse(noTokenResponse, tokenMap);
    assert.equal(r1.restoredText, noTokenResponse);
    assert.equal(r1.restoredCount, 0);
    assert.deepEqual(r1.matchedTokens, []);

    const r2 = rehydrateResponse('Hello [PERSON_1]', {});
    assert.equal(r2.restoredText, 'Hello [PERSON_1]');
    assert.equal(r2.restoredCount, 0);
    assert.deepEqual(r2.matchedTokens, []);
  });

  it('prevents JavaScript string.replace special characters ($&, $1, $\') from corrupting original values', () => {
    // If original PII contains dollar signs, API keys with $, or regex replacement tokens
    const trickyMap: Record<string, string> = {
      '[SECRET_1]': 'sk_test_$&_safe_token_$1_value',
      '[PRICE_1]': '$1,500,000 USD'
    };

    const aiResponse = 'Auth token is [SECRET_1] and invoice is [PRICE_1].';
    const result = rehydrateResponse(aiResponse, trickyMap);

    assert.equal(
      result.restoredText,
      'Auth token is sk_test_$&_safe_token_$1_value and invoice is $1,500,000 USD.'
    );
    assert.equal(result.restoredCount, 2);
  });

  it('avoids prefix collisions when tokenMap contains both [TOKEN_1] and [TOKEN_10]', () => {
    const collisionMap: Record<string, string> = {
      '[PERSON_1]': 'Alice',
      '[PERSON_10]': 'Zack'
    };

    const aiResponse = 'Greetings [PERSON_10] and [PERSON_1].';
    const result = rehydrateResponse(aiResponse, collisionMap);

    assert.equal(result.restoredText, 'Greetings Zack and Alice.');
    assert.equal(result.restoredCount, 2);
  });
});
