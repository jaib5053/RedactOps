import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RULES } from '../src/engine/regexRules';

function getRule(id: string) {
  const rule = DEFAULT_RULES.find(r => r.id === id);
  if (!rule) throw new Error(`Rule ${id} not found`);
  return rule;
}

function matches(ruleId: string, text: string): boolean {
  const rule = getRule(ruleId);
  const regex = new RegExp(rule.regex.source, rule.regex.flags);
  return regex.test(text);
}

function extractMatches(ruleId: string, text: string): string[] {
  const rule = getRule(ruleId);
  const regex = new RegExp(rule.regex.source, rule.regex.flags);
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const captured = m.slice(1).find(g => g !== undefined);
    results.push(captured !== undefined ? captured : m[0]);
    if (regex.lastIndex === m.index) regex.lastIndex++;
  }
  return results;
}

describe('Rule 1: Social Security Numbers (SSN)', () => {
  it('detects valid SSN formats (hyphenated, spaced, and unhyphenated)', () => {
    assert.equal(matches('ssn', '123-45-6789'), true);
    assert.equal(matches('ssn', '123 45 6789'), true);
    assert.equal(matches('ssn', '123456789'), true);
    assert.equal(matches('ssn', 'SSN is 451-92-3819 for tax.'), true);
  });

  it('rejects invalid SSN patterns according to SSA specifications', () => {
    assert.equal(matches('ssn', '000-12-3456'), false); // Starts with 000
    assert.equal(matches('ssn', '666-12-3456'), false); // Starts with 666
    assert.equal(matches('ssn', '912-34-5678'), false); // Starts with 9xx
    assert.equal(matches('ssn', '123-00-4567'), false); // Middle group is 00
    assert.equal(matches('ssn', '123-45-0000'), false); // End group is 0000
    assert.equal(matches('ssn', '123-45-678'), false);  // Too short
    assert.equal(matches('ssn', '123-45-67890'), false); // Too long
    assert.equal(matches('ssn', '123-ab-6789'), false); // Letters
  });

  it('handles adversarial edge cases around word boundaries', () => {
    assert.equal(matches('ssn', 'ref:123-45-6789;'), true);
    assert.equal(matches('ssn', '(123-45-6789)'), true);
    assert.equal(matches('ssn', 'item#123-45-6789'), true);
    assert.equal(matches('ssn', 'abc123-45-6789xyz'), false); // Embedded in letters
  });
});

describe('Rule 2: Credit Card Numbers', () => {
  it('detects standard Visa, MasterCard, Amex, Discover in hyphenated, spaced, and raw forms', () => {
    // Visa (16 digits)
    assert.equal(matches('credit_card', '4532-1234-5678-9012'), true);
    assert.equal(matches('credit_card', '4532 1234 5678 9012'), true);
    assert.equal(matches('credit_card', '4532123456789012'), true);
    // MasterCard (5-series and 2-series)
    assert.equal(matches('credit_card', '5105-1051-0510-5100'), true);
    assert.equal(matches('credit_card', '5500 1234 5678 9012'), true);
    assert.equal(matches('credit_card', '2221-1234-5678-9012'), true);
    // Amex (15 digits: 4-6-5 format or unspaced)
    assert.equal(matches('credit_card', '3782-822463-10005'), true);
    assert.equal(matches('credit_card', '3412 345678 90123'), true);
    // Discover
    assert.equal(matches('credit_card', '6011-1234-5678-9012'), true);
    assert.equal(matches('credit_card', '6500 1234 5678 9012'), true);
  });

  it('rejects invalid card numbers and incorrect length sequences', () => {
    assert.equal(matches('credit_card', '1234-5678-9012-3456'), false); // Invalid BIN
    assert.equal(matches('credit_card', '4532-1234-5678'), false);      // Truncated
    assert.equal(matches('credit_card', '4532-1234-5678-90123'), false); // 17 digits
    assert.equal(matches('credit_card', '4532-123a-5678-9012'), false); // Contains letter
  });
});

describe('Rule 3: Email Addresses', () => {
  it('detects RFC-compliant emails with various subdomains and tags', () => {
    assert.equal(matches('email', 'alex.rivera@meridian-health.org'), true);
    assert.equal(matches('email', 'user+newsletter@sub.domain.co.uk'), true);
    assert.equal(matches('email', 'first_last.123@company.io'), true);
    assert.equal(matches('email', 'helena.drake@vertexlogistics.co.uk'), true);
  });

  it('rejects non-emails and malformed strings', () => {
    assert.equal(matches('email', '@notanemail.com'), false);
    assert.equal(matches('email', 'user@.com'), false);
    assert.equal(matches('email', 'user@domain'), false);
    assert.equal(matches('email', 'just plain text without email format'), false);
  });

  it('isolates email boundaries without capturing trailing punctuation', () => {
    const extracted = extractMatches('email', 'Contact me at test@example.com, please.');
    assert.deepEqual(extracted, ['test@example.com']);
  });
});

describe('Rule 4: Phone Numbers', () => {
  it('detects standard US and international formats', () => {
    assert.equal(matches('phone', '(555) 382-9102'), true);
    assert.equal(matches('phone', '555-382-9102'), true);
    assert.equal(matches('phone', '555.382.9102'), true);
    assert.equal(matches('phone', '+1 (555) 382-9102'), true);
    assert.equal(matches('phone', '1-800-555-0199'), true);
    assert.equal(matches('phone', '+44 20 7123 4567'), true);
  });

  it('does NOT consume leading whitespace when no country code exists', () => {
    const text = 'Call me at (555) 382-9102 right away';
    const rule = getRule('phone');
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    const match = regex.exec(text);
    assert.ok(match);
    assert.equal(match[0], '(555) 382-9102');
    assert.equal(match[0].startsWith(' '), false);
  });

  it('rejects invalid or too short sequences', () => {
    assert.equal(matches('phone', '555-12'), false);
    assert.equal(matches('phone', 'phone: 12345'), false);
    assert.equal(matches('phone', 'item555-382-9102'), false); // lookbehind (?<!\w) prevents mid-word capture
  });
});

describe('Rule 5: API Keys, Tokens & Secrets', () => {
  it('detects Stripe, Anthropic, OpenAI, AWS, GitHub, and Google keys', () => {
    assert.equal(matches('api_keys', 'ghp_MockGitHubPersonalAccessToken36Chars'), true);
    assert.equal(matches('api_keys', 'sk-ant-api03-Kx98234-92384729384729384729384729384'), true);
    assert.equal(matches('api_keys', 'AKIAIOSFODNN7EXAMPLE'), true);
    assert.equal(matches('api_keys', 'ASIAIOSFODNN7EXAMPLE'), true);
    assert.equal(matches('api_keys', 'ghp_123456789012345678901234567890123456'), true);
    assert.equal(matches('api_keys', 'AIzaSyD-1234567890123456789012345678901'), true);
  });

  it('rejects truncated keys or non-matching prefixes', () => {
    assert.equal(matches('api_keys', 'sk_test_short'), false);
    assert.equal(matches('api_keys', 'AKIA_SHORT'), false);
    assert.equal(matches('api_keys', 'ghp_short'), false);
    assert.equal(matches('api_keys', 'my_random_secret_token_12345'), false);
  });
});

describe('Rule 6: JSON Web Tokens (JWT)', () => {
  it('detects standard 3-part base64url encoded tokens', () => {
    const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    assert.equal(matches('jwt', sampleJwt), true);
  });

  it('rejects prose with periods and non-JWT strings', () => {
    assert.equal(matches('jwt', 'This is a sentence. And another sentence. And a third.'), false);
    assert.equal(matches('jwt', 'eyInvalidTokenWithoutEnoughParts'), false);
  });
});

describe('Rule 7: IP Addresses (v4/v6)', () => {
  it('detects valid IPv4 and IPv6 addresses', () => {
    assert.equal(matches('ip_address', '192.168.1.45'), true);
    assert.equal(matches('ip_address', '10.0.0.1'), true);
    assert.equal(matches('ip_address', '172.16.254.1'), true);
    assert.equal(matches('ip_address', '255.255.255.255'), true);
    assert.equal(matches('ip_address', '0.0.0.0'), true);
    assert.equal(matches('ip_address', '2001:0db8:85a3:0000:0000:8a2e:0370:7334'), true);
    assert.equal(matches('ip_address', '::1'), true);
  });

  it('rejects invalid octets > 255 and wrong segment counts', () => {
    assert.equal(matches('ip_address', '256.0.0.1'), false);
    assert.equal(matches('ip_address', '192.168.1.999'), false);
    assert.equal(matches('ip_address', '192.168.1'), false);
    assert.equal(matches('ip_address', '1.2.3.4.5'), false);
  });
});

describe('Rule 8: Medical Record Numbers (MRN / HIPAA)', () => {
  it('detects MRN, Patient ID, Chart #, and MedRec labels', () => {
    assert.equal(matches('mrn', 'MRN: MED-894102'), true);
    assert.equal(matches('mrn', 'MRN: 123456'), true);
    assert.equal(matches('mrn', 'Patient ID: A1234567'), true);
    assert.equal(matches('mrn', 'Chart # C-991203'), true);
    assert.equal(matches('mrn', 'MedRec-894102'), true);
  });

  it('rejects too short IDs and unrelated text', () => {
    assert.equal(matches('mrn', 'MRN: 12'), false);
    assert.equal(matches('mrn', 'Normal patient without record number'), false);
  });
});

describe('Rule 9: Dates of Birth (DOB)', () => {
  it('detects standard US (MM/DD/YYYY) and ISO (YYYY-MM-DD) birth dates', () => {
    assert.equal(matches('dob', 'DOB: 05/14/1982'), true);
    assert.equal(matches('dob', 'Birthdate: 1982-05-14'), true);
    assert.equal(matches('dob', 'Date of Birth: 12/31/1999'), true);
    assert.equal(matches('dob', 'DOB: 5/4/82'), true);
  });

  it('rejects non-date values', () => {
    assert.equal(matches('dob', 'DOB: yesterday'), false);
    assert.equal(matches('dob', 'Birthdate: pending verification'), false);
  });
});

describe('Rule 10: International Bank Account Numbers (IBAN)', () => {
  it('detects UK, German, French, and compact IBAN formats without truncation', () => {
    // UK IBAN (22 chars)
    const ukIban = 'GB29 NWBK 6016 1331 9268 19';
    assert.equal(matches('iban', ukIban), true);
    const ukMatches = extractMatches('iban', ukIban);
    assert.equal(ukMatches[0], ukIban);

    // German IBAN (22 chars)
    assert.equal(matches('iban', 'DE89 3704 0044 0532 0130 00'), true);
    // French IBAN (27 chars)
    assert.equal(matches('iban', 'FR14 2004 1010 0505 0001 3M02 606'), true);
    // Unspaced IBAN
    assert.equal(matches('iban', 'DE89370400440532013000'), true);
  });

  it('rejects invalid IBANs without country codes or bad checksums', () => {
    assert.equal(matches('iban', '1234 5678 9012 3456'), false);
    assert.equal(matches('iban', 'GBXX 1234 5678'), false);
    assert.equal(matches('iban', 'GB29'), false);
  });
});

describe('Rule 11: Physical Street Addresses', () => {
  it('detects full street addresses across diverse standard suffixes', () => {
    assert.equal(matches('street_address', '742 Evergreen Terrace'), true);
    assert.equal(matches('street_address', '1440 Ocean Parkway'), true);
    assert.equal(matches('street_address', '100 Main Street'), true);
    assert.equal(matches('street_address', '500 Enterprise Way'), true);
    assert.equal(matches('street_address', '123 Broadway Blvd'), true);
    assert.equal(matches('street_address', '456 Oak Avenue'), true);
    assert.equal(matches('street_address', '789 Maple Rd'), true);
    assert.equal(matches('street_address', '12 Elm Dr'), true);
    assert.equal(matches('street_address', '34 Pine Ln'), true);
    assert.equal(matches('street_address', '56 Cedar Ct'), true);
    assert.equal(matches('street_address', '89 Market Place'), true);
  });

  it('rejects standalone numbers and suffixless names', () => {
    assert.equal(matches('street_address', 'Just a Street'), false);
    assert.equal(matches('street_address', '123 456 789'), false);
    assert.equal(matches('street_address', 'Room 101'), false);
  });
});

describe('Rule 12: Contextual Names', () => {
  it('detects person names preceded by titles, legal roles, or healthcare designations', () => {
    assert.equal(matches('names_contextual', 'Patient Jonathan Hastings'), true);
    assert.equal(matches('names_contextual', 'Patient: Jonathan Hastings'), true);
    assert.equal(matches('names_contextual', 'Dr. Sarah Vance'), true);
    assert.equal(matches('names_contextual', 'Attorney Rachel Morrison'), true);
    assert.equal(matches('names_contextual', 'Client David Steinberg'), true);
    assert.equal(matches('names_contextual', 'Mr. John Smith'), true);
    assert.equal(matches('names_contextual', 'Mrs. Jane Doe'), true);
    assert.equal(matches('names_contextual', 'Ms. Alice Wonder'), true);
    assert.equal(matches('names_contextual', 'Plaintiff Jonathan Doe'), true);
    assert.equal(matches('names_contextual', 'Defendant Richard Roe'), true);
    assert.equal(matches('names_contextual', 'CEO Marcus Sterling'), true);
    assert.equal(matches('names_contextual', 'CFO Helena Drake'), true);
  });

  it('isolates the name and avoids capturing technical labels via negative lookahead', () => {
    assert.equal(matches('names_contextual', 'Client Session Token'), false);
    assert.equal(matches('names_contextual', 'Patient Database Server'), false);
    assert.equal(matches('names_contextual', 'Attorney Summary Report'), false);
  });
});
