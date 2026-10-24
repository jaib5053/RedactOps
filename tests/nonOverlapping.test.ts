import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processMasking } from '../src/engine/maskingEngine';
import { DEFAULT_RULES } from '../src/engine/regexRules';
import { EntityRule } from '../src/types';

describe('Non-Overlapping Entity Resolution', () => {
  it('prioritizes the longest match when spans overlap', async () => {
    // Custom test rules where Rule Short has span of 5 chars and Rule Long has span of 18 chars
    // Short starts at index 0, Long starts at index 2
    const shortRule: EntityRule = {
      id: 'short_id',
      name: 'Short Rule',
      description: 'Matches short pattern',
      category: 'technical',
      regex: /SHORT/g,
      tokenPrefix: 'SHORT',
      example: 'SHORT',
      enabled: true,
      color: ''
    };

    const longRule: EntityRule = {
      id: 'long_id',
      name: 'Long Rule',
      description: 'Matches longer pattern overlapping short',
      category: 'technical',
      regex: /ORT_EXTENDED_IDENTIFIER/g,
      tokenPrefix: 'LONG',
      example: 'ORT_EXTENDED_IDENTIFIER',
      enabled: true,
      color: ''
    };

    // Text: "SHORT_EXTENDED_IDENTIFIER"
    // "SHORT" is indices [0, 5] (length 5)
    // "ORT_EXTENDED_IDENTIFIER" is indices [2, 25] (length 23)
    const text = 'Notice: SHORT_EXTENDED_IDENTIFIER is processed.';
    const result = await processMasking(text, [shortRule, longRule], 'token');

    assert.equal(result.entities.length, 1);
    assert.equal(result.entities[0].ruleId, 'long_id');
    assert.equal(result.entities[0].rawText, 'ORT_EXTENDED_IDENTIFIER');
    assert.equal(result.sanitizedText, 'Notice: SH[LONG_1] is processed.');
  });

  it('preserves contiguous boundaries between adjacent entities', async () => {
    const text = '123-45-67894532123456789012'; // contiguous SSN immediately followed by CC
    // Let's test two distinct entities placed contiguously
    const ruleA: EntityRule = {
      id: 'part_a',
      name: 'Part A',
      description: 'First 5 chars',
      category: 'technical',
      regex: /ALPHA/g,
      tokenPrefix: 'ALPHA',
      example: 'ALPHA',
      enabled: true,
      color: ''
    };

    const ruleB: EntityRule = {
      id: 'part_b',
      name: 'Part B',
      description: 'Next 5 chars',
      category: 'technical',
      regex: /BETA1/g,
      tokenPrefix: 'BETA',
      example: 'BETA1',
      enabled: true,
      color: ''
    };

    const contiguousText = 'PREFIX_ALPHABETA1_SUFFIX';
    const result = await processMasking(contiguousText, [ruleA, ruleB], 'token');

    assert.equal(result.entities.length, 2);
    assert.equal(result.entities[0].rawText, 'ALPHA');
    assert.equal(result.entities[1].rawText, 'BETA1');
    assert.equal(result.sanitizedText, 'PREFIX_[ALPHA_1][BETA_1]_SUFFIX');
  });

  it('resolves enclosing matches where one entity is nested inside another', async () => {
    // An SSN formatted inside an MRN identifier: "MRN: MED-123-45-6789"
    const text = 'Patient chart MRN: MED-123-45-6789 verified.';
    const result = await processMasking(text, DEFAULT_RULES, 'token');

    // MRN rule matches "MRN: MED-123-45-6789"
    // SSN rule matches "123-45-6789"
    // Since MRN is the longer match (20 chars vs 11 chars), MRN must win
    const mrnEntity = result.entities.find(e => e.ruleId === 'mrn');
    const ssnEntity = result.entities.find(e => e.ruleId === 'ssn');

    assert.ok(mrnEntity, 'MRN entity must be detected');
    assert.equal(ssnEntity, undefined, 'Nested SSN must be subsumed by MRN');
    assert.equal(result.entities.length, 1);
  });

  it('resolves duplicate identical-span matches deterministically without corrupted replacement', async () => {
    const rule1: EntityRule = {
      id: 'rule_1',
      name: 'Rule 1',
      description: 'Matches token',
      category: 'technical',
      regex: /DUPLICATE_TARGET/g,
      tokenPrefix: 'ONE',
      example: 'DUPLICATE_TARGET',
      enabled: true,
      color: ''
    };

    const rule2: EntityRule = {
      id: 'rule_2',
      name: 'Rule 2',
      description: 'Also matches same token',
      category: 'technical',
      regex: /DUPLICATE_TARGET/g,
      tokenPrefix: 'TWO',
      example: 'DUPLICATE_TARGET',
      enabled: true,
      color: ''
    };

    const text = 'Here is DUPLICATE_TARGET.';
    const result = await processMasking(text, [rule1, rule2], 'token');

    assert.equal(result.entities.length, 1);
    assert.equal(result.sanitizedText, 'Here is [ONE_1].');
  });

  it('respects rule enabled/disabled toggles during overlap conflict resolution', async () => {
    const ruleA: EntityRule = {
      id: 'rule_a',
      name: 'Rule A',
      description: 'Longer span',
      category: 'technical',
      regex: /OVERLAPPING_TARGET/g,
      tokenPrefix: 'A',
      example: 'OVERLAPPING_TARGET',
      enabled: false, // Disabled
      color: ''
    };

    const ruleB: EntityRule = {
      id: 'rule_b',
      name: 'Rule B',
      description: 'Shorter span inside',
      category: 'technical',
      regex: /TARGET/g,
      tokenPrefix: 'B',
      example: 'TARGET',
      enabled: true,
      color: ''
    };

    const text = 'Testing OVERLAPPING_TARGET here.';
    const result = await processMasking(text, [ruleA, ruleB], 'token');

    assert.equal(result.entities.length, 1);
    assert.equal(result.entities[0].ruleId, 'rule_b');
    assert.equal(result.sanitizedText, 'Testing OVERLAPPING_[B_1] here.');
  });
});
