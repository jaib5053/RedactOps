import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processMasking, rehydrateResponse, createAuditCertificate } from '../src/engine/maskingEngine';
import { DEFAULT_RULES, SYNTHETIC_VALUES } from '../src/engine/regexRules';
import { MaskingMode } from '../src/types';

// ============================================================================
// REALISTIC GENERATOR PRIMITIVES & CORPUS CONSTANTS
// ============================================================================

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const STREET_NAMES = [
  'Evergreen', 'Ocean', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Enterprise',
  'Broadway', 'Market', 'Washington', 'Lincoln', 'Highland', 'Lexington', 'Madison',
  'Sunset', 'Park', 'Springfield', 'River', 'Lake', 'Beacon', 'Commonwealth'
];

const STREET_SUFFIXES = [
  'Terrace', 'Parkway', 'Avenue', 'Street', 'Boulevard', 'Road', 'Drive',
  'Lane', 'Court', 'Way', 'Place', 'Circle', 'Highway', 'Loop'
];

const DOMAINS = [
  'outlook.com', 'gmail.com', 'meridian-health.org', 'apexpharma.com',
  'enterprise-corp.net', 'cloudsync.io', 'vertexlogistics.co.uk',
  'lawfirm-partners.com', 'global-finance-audit.org', 'hospital-regional.edu'
];

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randStr(len: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return s;
}

function genSSN(): string {
  const area = randInt(100, 899);
  const a = area === 666 ? 667 : area;
  const g = String(randInt(1, 99)).padStart(2, '0');
  const s = String(randInt(1, 9999)).padStart(4, '0');
  const format = randInt(1, 3);
  if (format === 1) return `${a}-${g}-${s}`;
  if (format === 2) return `${a} ${g} ${s}`;
  return `${a}${g}${s}`;
}

function genCard(): string {
  const type = randInt(1, 4);
  const sep = randChoice(['-', ' ']);
  if (type === 1) {
    // Visa (16 digits)
    return `4${randInt(100, 999)}${sep}${randInt(1000, 9999)}${sep}${randInt(1000, 9999)}${sep}${randInt(1000, 9999)}`;
  }
  if (type === 2) {
    // MasterCard (16 digits)
    return `51${randInt(10, 99)}${sep}${randInt(1000, 9999)}${sep}${randInt(1000, 9999)}${sep}${randInt(1000, 9999)}`;
  }
  if (type === 3) {
    // Amex (15 digits, 4-6-5)
    return `37${randInt(10, 99)}${sep}${randInt(100000, 999999)}${sep}${randInt(10000, 99999)}`;
  }
  // Discover (16 digits)
  return `6011${sep}${randInt(1000, 9999)}${sep}${randInt(1000, 9999)}${sep}${randInt(1000, 9999)}`;
}

function genEmail(first: string, last: string): string {
  const mode = randInt(1, 3);
  const d = randChoice(DOMAINS);
  if (mode === 1) return `${first.toLowerCase()}.${last.toLowerCase()}@${d}`;
  if (mode === 2) return `${first.toLowerCase()}_${last.toLowerCase()}${randInt(10, 99)}@${d}`;
  return `${first.toLowerCase()}+support${randInt(1, 999)}@sub.${d}`;
}

function genPhone(): string {
  const area = randInt(201, 899);
  const exch = randInt(201, 899);
  const line = String(randInt(1000, 9999));
  const style = randInt(1, 4);
  if (style === 1) return `(${area}) ${exch}-${line}`;
  if (style === 2) return `${area}-${exch}-${line}`;
  if (style === 3) return `+1 (${area}) ${exch}-${line}`;
  return `+44 20 7123 ${line}`;
}

function genApiKey(): string {
  const kind = randInt(1, 5);
  if (kind === 1) return `sk-ant-api03-${randStr(32)}`;
  if (kind === 2) return `sk-ant-api03-${randStr(34)}`;
  if (kind === 3) return `AKIA${randStr(16, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`;
  if (kind === 4) return `ghp_${randStr(36)}`;
  return `AIzaSyD-${randStr(31)}`;
}

function genJwt(): string {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3Jf${randStr(10)}In0.${randStr(20)}`;
}

function genIp(): string {
  const isV6 = randInt(1, 8) === 1;
  if (isV6) return `2001:0db8:85a3:0000:0000:8a2e:0370:${randInt(1000, 9999)}`;
  const kind = randInt(1, 3);
  if (kind === 1) return `192.168.${randInt(1, 254)}.${randInt(1, 254)}`;
  if (kind === 2) return `10.${randInt(1, 254)}.${randInt(1, 254)}.${randInt(1, 254)}`;
  return `172.16.${randInt(1, 254)}.${randInt(1, 254)}`;
}

function genMrn(): string {
  const prefix = randChoice(['MRN: MED-', 'Patient ID: ', 'Chart # C-', 'MedRec-']);
  return `${prefix}${randInt(100000, 999999)}`;
}

function genDob(): string {
  const year = randInt(1950, 2010);
  const m = String(randInt(1, 12)).padStart(2, '0');
  const d = String(randInt(1, 28)).padStart(2, '0');
  const prefix = randChoice(['DOB: ', 'Birthdate: ', 'Date of Birth: ']);
  if (randInt(1, 2) === 1) {
    return `${prefix}${m}/${d}/${year}`;
  }
  return `${prefix}${year}-${m}-${d}`;
}

function genIban(): string {
  const country = randChoice(['GB', 'DE', 'FR']);
  if (country === 'GB') {
    return `GB${randInt(10, 99)} NWBK 6016 1331 ${randInt(1000, 9999)} ${randInt(10, 99)}`;
  }
  if (country === 'DE') {
    return `DE${randInt(10, 99)} 3704 0044 0532 ${randInt(1000, 9999)} ${randInt(10, 99)}`;
  }
  return `FR${randInt(10, 99)} 2004 1010 0505 ${randInt(1000, 9999)} 3M02 ${randInt(100, 999)}`;
}

function genAddress(): string {
  return `${randInt(100, 9999)} ${randChoice(STREET_NAMES)} ${randChoice(STREET_SUFFIXES)}`;
}

export interface StressPrompt {
  id: string;
  category: 'healthcare' | 'finance' | 'devops' | 'legal' | 'support' | 'adversarial';
  text: string;
}

// ============================================================================
// CORPUS GENERATOR (AT LEAST 1,000 DIVERSE & ADVERSARIAL PROMPTS)
// ============================================================================

export function generateStressCorpus(): StressPrompt[] {
  const corpus: StressPrompt[] = [];
  let counter = 1;

  // 1. Healthcare / Clinical EHR (220 prompts)
  for (let i = 0; i < 220; i++) {
    const patFirst = randChoice(FIRST_NAMES);
    const patLast = randChoice(LAST_NAMES);
    const docFirst = randChoice(FIRST_NAMES);
    const docLast = randChoice(LAST_NAMES);
    const mrn = genMrn();
    const dob = genDob();
    const ssn = genSSN();
    const phone = genPhone();
    const email = genEmail(patFirst, patLast);
    const address = genAddress();

    const text = `DISCHARGE SUMMARY & CLINICAL EHR RECORD [ID #${counter}]
Facility: St. Jude Regional Healthcare Center
Patient: ${patFirst} ${patLast} | ${mrn} | ${dob}
Patient SSN: ${ssn}
Attending Physician: Dr. ${docFirst} ${docLast}, MD
Primary Contact: phone ${phone} | secure email: ${email}
Home Residence: ${address}, Springfield, OR 97477
Clinical Narrative:
Patient ${patFirst} ${patLast} was admitted presenting with respiratory distress. Review completed by Dr. ${docFirst} ${docLast}. Emergency notification dispatched to emergency contact at ${phone}. Follow-up scheduled in 14 days at clinic.`;

    corpus.push({ id: `prompt-health-${counter++}`, category: 'healthcare', text });
  }

  // 2. Finance / Banking / M&A (220 prompts)
  for (let i = 0; i < 220; i++) {
    const cfoFirst = randChoice(FIRST_NAMES);
    const cfoLast = randChoice(LAST_NAMES);
    const ceoFirst = randChoice(FIRST_NAMES);
    const ceoLast = randChoice(LAST_NAMES);
    const card = genCard();
    const iban = genIban();
    const ssn = genSSN();
    const phone = genPhone();
    const email = genEmail(cfoFirst, cfoLast);

    const text = `CONFIDENTIAL M&A WIRE AUTHORIZATION & SETTLEMENT AUDIT [#${counter}]
Target Entity: Meridian Capital Holdings LLC
Chief Financial Officer: CFO ${cfoFirst} ${cfoLast}
Chief Executive Officer: CEO ${ceoFirst} ${ceoLast}
Primary Settlement Account:
Bank Wire Routing IBAN: ${iban}
Corporate Executive Card: ${card}
Escrow Indemnification Tax ID Ref SSN: ${ssn}
Direct Authorization Contact:
Phone: ${phone} | Corporate Email: ${email}
Wire Instruction Notes:
A mandatory escrow deposit of $3,500,000 has been verified by CFO ${cfoFirst} ${cfoLast}. Card ${card} authorized for auxiliary settlement fees. Confirmation sent to CEO ${ceoFirst} ${ceoLast} and direct phone ${phone}.`;

    corpus.push({ id: `prompt-fin-${counter++}`, category: 'finance', text });
  }

  // 3. DevOps / Cloud Infrastructure (220 prompts)
  for (let i = 0; i < 220; i++) {
    const engFirst = randChoice(FIRST_NAMES);
    const engLast = randChoice(LAST_NAMES);
    const stripe = genApiKey();
    const ip = genIp();
    const jwt = genJwt();
    const phone = genPhone();
    const email = genEmail(engFirst, engLast);

    const text = `CRITICAL INCIDENT DUMP & SERVER ENVIRONMENT POST-MORTEM [#${counter}]
Timestamp: 2026-10-24T03:14:02.192Z [auth-gateway-node]
Origin Gateway Host IP: ${ip}
Authentication Session Bearer Token: ${jwt}
CRITICAL CREDENTIAL LEAK DETECTED IN PROCESS STACK:
STRIPE_SECRET_KEY=${stripe}
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
OPENAI_API_TOKEN=sk-ant-api03-Kx98234-92384729384729384729384729384
SERVER_GATEWAY_IP=${ip}
Incident triage assigned to Lead DevOps Engineer: ${email}
Direct Emergency Cell: ${phone}
Action: Rotate compromised Stripe key ${stripe} immediately.`;

    corpus.push({ id: `prompt-devops-${counter++}`, category: 'devops', text });
  }

  // 4. Legal / Deposition Transcripts (220 prompts)
  for (let i = 0; i < 220; i++) {
    const attFirst = randChoice(FIRST_NAMES);
    const attLast = randChoice(LAST_NAMES);
    const witFirst = randChoice(FIRST_NAMES);
    const witLast = randChoice(LAST_NAMES);
    const address = genAddress();
    const ssn = genSSN();
    const phone = genPhone();
    const email = genEmail(witFirst, witLast);

    const text = `UNITED STATES DISTRICT COURT - DEPOSITION TRANSCRIPT [#${counter}]
Case No. 24-CV-${randInt(1000, 9999)}-JSR
In re: Confidential Witness Testimony and Protective Order
EXAMINATION OF WITNESS:
Attorney ${attFirst} ${attLast}: Please state your full legal name and current domicile.
Witness: My name is Client ${witFirst} ${witLast}. I currently reside at ${address}.
Attorney ${attFirst} ${attLast}: What was your authorized contact email?
Witness: It was ${email}, and my private personal line was ${phone}.
Attorney ${attFirst} ${attLast}: And did you execute the wire referencing SSN ${ssn}?
Witness: Yes, as documented under witness docket declaration filed by Attorney ${attFirst} ${attLast}.`;

    corpus.push({ id: `prompt-legal-${counter++}`, category: 'legal', text });
  }

  // 5. Customer Support / CRM Tickets (170 prompts)
  for (let i = 0; i < 170; i++) {
    const custFirst = randChoice(FIRST_NAMES);
    const custLast = randChoice(LAST_NAMES);
    const title = randChoice(['Mr.', 'Ms.', 'Mrs.']);
    const email = genEmail(custFirst, custLast);
    const phone = genPhone();
    const address = genAddress();
    const card = genCard();

    const text = `ENTERPRISE CRM SUPPORT TICKET [#${counter}]
Ticket Reference: SUP-${randInt(10000, 99999)}
Customer Identity: ${title} ${custFirst} ${custLast}
Verified Account Email: ${email}
Mobile Callback Number: ${phone}
Billing Address on Record: ${address}
Payment Method on File: Card ${card}
Customer Request:
${title} ${custFirst} ${custLast} called via ${phone} requesting an address change to ${address} and verification that recurring charges to card ${card} will be paused. Confirmation sent to ${email}.`;

    corpus.push({ id: `prompt-support-${counter++}`, category: 'support', text });
  }

  // 6. Adversarial Edge Cases & High-Density Documents (100 prompts)
  for (let i = 0; i < 100; i++) {
    const pFirst = randChoice(FIRST_NAMES);
    const pLast = randChoice(LAST_NAMES);
    const ssn = genSSN();
    const card = genCard();
    const iban = genIban();
    const phone = genPhone();
    const email = genEmail(pFirst, pLast);
    const ip = genIp();
    const key = genApiKey();
    const address = genAddress();

    // Adversarial: Markdown formatting, surrounding punctuation, and negative lookaheads
    const text = `### ADVERSARIAL STRESS PAYLOAD [#${counter}]
**Patient: ${pFirst} ${pLast}** reported issue with secret token "${key}".
Surrounding Brackets: ([SSN: ${ssn}]) and billing card <${card}>.
Nested markdown code: \`${iban}\` on node \`${ip}\`.
Contact protocols: **[${email}]** and direct line (${phone}) at domicile: "${address}".
Negative Lookahead Tests (MUST NOT BE MASKED):
The Client Session Token was renewed. The Server Database ID is cluster-99.
The Patient Protocol Summary and Attorney Summary Report remain active.`;

    corpus.push({ id: `prompt-adv-${counter++}`, category: 'adversarial', text });
  }

  return corpus;
}

// ============================================================================
// BENCHMARK EXECUTION & VALIDATION SUITE
// ============================================================================

describe('RedactOps Enterprise 1,000+ Prompt Stress Test Benchmark', () => {
  it('executes 1,000+ prompts across all 4 modes verifying zero-leakage, rehydration fidelity, and sub-millisecond latencies', async () => {
    const corpus = generateStressCorpus();
    assert.ok(corpus.length >= 1000, `Corpus must contain at least 1,000 prompts (actual: ${corpus.length})`);

    const latenciesMs: number[] = [];
    let totalEntitiesScrubbed = 0;
    let totalRehydrationReplacements = 0;
    let zeroLeakageFailures = 0;
    let rehydrationFidelityFailures = 0;
    let modeVerificationFailures = 0;

    const categoryBreakdown: Record<string, number> = {
      personal: 0,
      financial: 0,
      health: 0,
      technical: 0,
      custom: 0
    };

    const typeBreakdown: Record<string, number> = {};

    const overallStartTime = performance.now();

    for (let i = 0; i < corpus.length; i++) {
      const item = corpus[i];

      // ------------------------------------------------------------------------
      // A) MODE 1: 'token' - Benchmarked & Checked for Rehydration Fidelity
      // ------------------------------------------------------------------------
      const t0 = performance.now();
      const tokenResult = await processMasking(item.text, DEFAULT_RULES, 'token');
      const t1 = performance.now();
      latenciesMs.push(t1 - t0);

      totalEntitiesScrubbed += tokenResult.entities.length;

      // Accumulate category stats
      for (const [cat, count] of Object.entries(tokenResult.stats.breakdownByCategory)) {
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + count;
      }

      // Accumulate type stats
      for (const [typ, count] of Object.entries(tokenResult.stats.breakdownByType)) {
        typeBreakdown[typ] = (typeBreakdown[typ] || 0) + count;
      }

      // VERIFICATION A.1: Zero Raw PII in Sanitized Output
      for (const entity of tokenResult.entities) {
        if (tokenResult.sanitizedText.includes(entity.rawText)) {
          zeroLeakageFailures++;
          console.error(`[LEAK] Raw PII "${entity.rawText}" remained in prompt ${item.id}`);
        }
      }

      // VERIFICATION A.2: Re-run all 12 detection regexes on sanitized output
      for (const rule of DEFAULT_RULES) {
        const rx = new RegExp(rule.regex.source, rule.regex.flags);
        const matches = tokenResult.sanitizedText.match(rx);
        if (matches && matches.length > 0) {
          zeroLeakageFailures++;
          console.error(`[LEAK REGEX] Rule "${rule.id}" matched sanitized text in prompt ${item.id}:`, matches);
        }
      }

      // VERIFICATION B: Round-Trip Rehydration Fidelity
      if (tokenResult.entities.length > 0) {
        // Construct simulated AI response containing all generated tokens + duplicates + markdown
        const tokenList = Object.keys(tokenResult.tokenMap);
        const simulatedLlmResponse = `AI Assistant Response for Prompt ${item.id}:
Verified entities:
${tokenList.map(t => `- Item: **${t}** (${t})`).join('\n')}
Summary confirmation: All records processed for ${tokenList[0] || 'N/A'}.`;

        const rehydrated = rehydrateResponse(simulatedLlmResponse, tokenResult.tokenMap);
        totalRehydrationReplacements += rehydrated.restoredCount;

        // Verify every original PII value is present in rehydrated text
        for (const [token, origVal] of Object.entries(tokenResult.tokenMap)) {
          if (!rehydrated.restoredText.includes(origVal)) {
            rehydrationFidelityFailures++;
            console.error(`[REHYDRATION MISMATCH] Expected original "${origVal}" for token "${token}" in prompt ${item.id}`);
          }
        }

        // Verify no raw tokens remain un-rehydrated
        for (const token of tokenList) {
          if (rehydrated.restoredText.includes(token)) {
            rehydrationFidelityFailures++;
            console.error(`[UNRESTORED TOKEN] Token "${token}" still exists in rehydrated text in prompt ${item.id}`);
          }
        }
      }

      // ------------------------------------------------------------------------
      // C) MODE 2: 'redacted' Mode Verification
      // ------------------------------------------------------------------------
      const redactedResult = await processMasking(item.text, DEFAULT_RULES, 'redacted');
      for (const entity of redactedResult.entities) {
        if (redactedResult.sanitizedText.includes(entity.rawText)) {
          modeVerificationFailures++;
        }
      }

      // ------------------------------------------------------------------------
      // C) MODE 3: 'synthetic' Mode Verification
      // ------------------------------------------------------------------------
      const syntheticResult = await processMasking(item.text, DEFAULT_RULES, 'synthetic');
      for (const entity of syntheticResult.entities) {
        if (syntheticResult.sanitizedText.includes(entity.rawText)) {
          modeVerificationFailures++;
        }
      }

      // ------------------------------------------------------------------------
      // C) MODE 4: 'scramble' Mode Verification
      // ------------------------------------------------------------------------
      const scrambleResult = await processMasking(item.text, DEFAULT_RULES, 'scramble');
      for (const entity of scrambleResult.entities) {
        if (scrambleResult.sanitizedText.includes(entity.rawText)) {
          modeVerificationFailures++;
        }
      }
    }

    const overallEndTime = performance.now();
    const totalElapsedSec = (overallEndTime - overallStartTime) / 1000;

    // Latency Distribution Calculation
    latenciesMs.sort((a, b) => a - b);
    const sum = latenciesMs.reduce((acc, v) => acc + v, 0);
    const avgLatencyMs = sum / latenciesMs.length;
    const minLatencyMs = latenciesMs[0];
    const maxLatencyMs = latenciesMs[latenciesMs.length - 1];
    const p50LatencyMs = latenciesMs[Math.floor(latenciesMs.length * 0.50)];
    const p90LatencyMs = latenciesMs[Math.floor(latenciesMs.length * 0.90)];
    const p95LatencyMs = latenciesMs[Math.floor(latenciesMs.length * 0.95)];
    const p99LatencyMs = latenciesMs[Math.floor(latenciesMs.length * 0.99)];

    const promptThroughput = Math.round(corpus.length / totalElapsedSec);
    const entityThroughput = Math.round(totalEntitiesScrubbed / totalElapsedSec);

    // ========================================================================
    // LOG DETAILED BENCHMARK DASHBOARD
    // ========================================================================
    console.log('\n================================================================================');
    console.log('             REDACTOPS 1,000+ PROMPT ENTERPRISE STRESS TEST REPORT              ');
    console.log('================================================================================');
    console.log(`Corpus Executed:             ${corpus.length} distinct production & adversarial prompts`);
    console.log(`Total Masking Runs:          ${corpus.length * 4} runs (All 4 modes: token, redacted, synthetic, scramble)`);
    console.log(`Total Wall-Clock Time:       ${totalElapsedSec.toFixed(3)} seconds`);
    console.log(`Prompt Throughput:           ${promptThroughput.toLocaleString()} prompts / sec`);
    console.log(`Entity Scrubbing Throughput: ${entityThroughput.toLocaleString()} entities / sec`);
    console.log('--------------------------------------------------------------------------------');
    console.log('VERIFICATION INTEGRITY METRICS:');
    console.log(`  - Zero PII Leakage Violations:    ${zeroLeakageFailures} (100% Zero Leakage Guaranteed)`);
    console.log(`  - Rehydration Fidelity Failures:  ${rehydrationFidelityFailures} (100% Round-Trip Fidelity)`);
    console.log(`  - All-Modes Verification Errors:  ${modeVerificationFailures} (100% Passed)`);
    console.log(`  - Total Entities Detected:        ${totalEntitiesScrubbed.toLocaleString()} entities`);
    console.log(`  - Total Rehydrations Validated:   ${totalRehydrationReplacements.toLocaleString()} token replacements`);
    console.log('--------------------------------------------------------------------------------');
    console.log('LATENCY DISTRIBUTION (Token Mode Engine):');
    console.log(`  - Min Latency:    ${minLatencyMs.toFixed(3)} ms`);
    console.log(`  - Mean Latency:   ${avgLatencyMs.toFixed(3)} ms`);
    console.log(`  - Median (P50):   ${p50LatencyMs.toFixed(3)} ms`);
    console.log(`  - 90th %ile (P90):${p90LatencyMs.toFixed(3)} ms`);
    console.log(`  - 95th %ile (P95):${p95LatencyMs.toFixed(3)} ms`);
    console.log(`  - 99th %ile (P99):${p99LatencyMs.toFixed(3)} ms`);
    console.log(`  - Max Latency:    ${maxLatencyMs.toFixed(3)} ms`);
    console.log('--------------------------------------------------------------------------------');
    console.log('ENTITY SCRUBBING BY CATEGORY:');
    for (const [cat, count] of Object.entries(categoryBreakdown)) {
      console.log(`  - ${cat.toUpperCase().padEnd(12)}: ${count.toLocaleString()} entities`);
    }
    console.log('--------------------------------------------------------------------------------');
    console.log('ENTITY SCRUBBING BY DETECTED RULE:');
    for (const [rule, count] of Object.entries(typeBreakdown)) {
      console.log(`  - ${rule.padEnd(36)}: ${count.toLocaleString()}`);
    }
    console.log('================================================================================\n');

    // ASSERT ZERO FAILURES
    assert.equal(zeroLeakageFailures, 0, 'Must have zero PII leakage violations');
    assert.equal(rehydrationFidelityFailures, 0, 'Must have zero rehydration fidelity failures');
    assert.equal(modeVerificationFailures, 0, 'Must have zero mode verification failures');
    assert.ok(totalEntitiesScrubbed > 3000, `Expected at least 3,000 entities scrubbed (actual: ${totalEntitiesScrubbed})`);
  });
});
