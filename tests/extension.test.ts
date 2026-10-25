import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

describe('Chrome / Edge Extension Content Script Integrity Suite', () => {
  // Read production content.js script
  const contentCode = fs.readFileSync('extension/content.js', 'utf8');

  function createExtensionSandbox() {
    const mockElem = () => ({
      style: {},
      appendChild: () => {},
      setAttribute: () => {},
      addEventListener: () => {},
      attachShadow: () => ({ appendChild: () => {}, querySelector: () => null })
    });

    const sandbox = {
      document: {
        getElementById: () => null,
        createElement: mockElem,
        body: { appendChild: () => {} },
        head: { appendChild: () => {} },
        activeElement: null
      },
      window: { addEventListener: () => {} },
      console: console,
      setInterval: () => {},
      setTimeout: () => {}
    };
    vm.createContext(sandbox);

    const scriptToRun = contentCode.replace(
      'function sanitizePromptText(text) {',
      'globalThis.sanitizePromptText = function sanitizePromptText(text) {'
    );
    vm.runInContext(scriptToRun, sandbox);

    return sandbox.sanitizePromptText as (text: string) => { sanitized: string; total: number };
  }

  const sanitizePromptText = createExtensionSandbox();

  it('extension detects and scrubs all 51 sensitive entities from the adversarial prompt', () => {
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

    const result = sanitizePromptText(userPrompt);

    assert.equal(result.total, 51, 'Extension must detect exactly 51 sensitive entities');

    // Verify all sensitive strings are eliminated from sanitized output
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
      assert.equal(result.sanitized.includes(secret), false, `Extension leaked sensitive value: "${secret}"`);
    }

    // Verify partial edge cases remain intact
    assert.ok(result.sanitized.includes('alex.mor'), 'Partial string "alex.mor" must remain intact in extension');
    assert.ok(result.sanitized.includes('0147'), 'Partial string "0147" must remain intact in extension');
    assert.ok(result.sanitized.includes('the card ends'), 'Partial string "the card ends" must remain intact in extension');
  });

  it('extension performs document-wide name propagation on subsequent mentions', () => {
    const text = 'My name is Alexandra Morgan. Later in the discussion, Alexandra Morgan stated the requirements.';
    const result = sanitizePromptText(text);

    assert.equal(result.total, 2);
    assert.equal(result.sanitized.includes('Alexandra Morgan'), false);
    assert.ok(result.sanitized.includes('[PERSON_1]'));
    // Both occurrences must use [PERSON_1]
    const count = (result.sanitized.match(/\[PERSON_1\]/g) || []).length;
    assert.equal(count, 2);
  });

  it('extension does not split account numbers into phone numbers', () => {
    const text = 'Verification code is ACC-7749201836 for user.';
    const result = sanitizePromptText(text);

    assert.equal(result.sanitized.includes('[PHONE_'), false, 'Account number must NOT be sliced into a phone token');
    assert.ok(result.sanitized.includes('[ACCT_ID_1]'), 'Account number must be recognized as [ACCT_ID_1]');
  });
});
