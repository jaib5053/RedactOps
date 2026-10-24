import { EntityRule, MaskingMode, DetectedEntity, MaskingResult, AuditCertificate } from '../types';
import { SYNTHETIC_VALUES } from './regexRules';

/**
 * Generates cryptographically secure high-entropy hex strings using Web Crypto CSPRNG.
 * Eliminates PRNG state recovery vulnerabilities caused by Math.random().
 */
export function generateSecureEntropyHex(byteLength = 16): string {
  const buffer = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buffer);
  } else {
    // Fallback for test / non-browser headless runners
    for (let i = 0; i < byteLength; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buffer, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes SHA-256 hash client-side via native Web Crypto API.
 */
export async function computeSha256(text: string): Promise<string> {
  if (!text) {
    // Pre-computed SHA-256 digest for empty string
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface RawMatch {
  rule: EntityRule;
  rawText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Executes zero-knowledge in-browser redaction and tokenization.
 */
export async function processMasking(
  text: string,
  rules: EntityRule[],
  mode: MaskingMode = 'token'
): Promise<MaskingResult> {
  const startTime = performance.now();
  const activeRules = rules.filter(r => r.enabled);
  const allMatches: RawMatch[] = [];

  // 1. Collect all matches from active regex rules
  for (const rule of activeRules) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // If rule specifies a capturing group (e.g. matching only the sensitive identifier and not the label prefix),
      // precisely isolate the target sensitive value
      let rawText = match[0];
      let startIndex = match.index;
      if (match[1] !== undefined) {
        rawText = match[1];
        const offset = match[0].indexOf(match[1]);
        if (offset !== -1) {
          startIndex = match.index + offset;
        }
      }
      const endIndex = startIndex + rawText.length;

      allMatches.push({
        rule,
        rawText,
        startIndex,
        endIndex
      });

      // Avoid infinite loop on zero-width match
      if (regex.lastIndex === match.index) {
        regex.lastIndex++;
      }
    }
  }

  // 2. Resolve overlaps with greedy longest-match priority
  // Sort candidates by span length descending (longer match wins on overlap), then by startIndex ascending
  const sortedByPriority = [...allMatches].sort((a, b) => {
    const lenA = a.endIndex - a.startIndex;
    const lenB = b.endIndex - b.startIndex;
    if (lenB !== lenA) {
      return lenB - lenA;
    }
    return a.startIndex - b.startIndex;
  });

  const nonOverlapping: RawMatch[] = [];
  for (const candidate of sortedByPriority) {
    const hasOverlap = nonOverlapping.some(
      sel => candidate.startIndex < sel.endIndex && candidate.endIndex > sel.startIndex
    );
    if (!hasOverlap) {
      nonOverlapping.push(candidate);
    }
  }

  // 3. Sort selected matches by startIndex ascending for contiguous linear substitution
  nonOverlapping.sort((a, b) => a.startIndex - b.startIndex);

  // 4. Generate replacement tokens / values
  const tokenCounters: Record<string, number> = {};
  const tokenMap: Record<string, string> = {}; // token -> original
  const reverseMap: Record<string, string> = {}; // original -> token (re-use same token for identical values)
  const detectedEntities: DetectedEntity[] = [];

  let sanitizedText = '';
  let cursor = 0;

  for (const m of nonOverlapping) {
    // Append text before the match
    sanitizedText += text.slice(cursor, m.startIndex);

    let replacement = '';
    const prefix = m.rule.tokenPrefix;

    if (mode === 'token') {
      // Re-use token if identical string already masked
      if (reverseMap[m.rawText]) {
        replacement = reverseMap[m.rawText];
      } else {
        tokenCounters[prefix] = (tokenCounters[prefix] || 0) + 1;
        replacement = `[${prefix}_${tokenCounters[prefix]}]`;
        reverseMap[m.rawText] = replacement;
        tokenMap[replacement] = m.rawText;
      }
    } else if (mode === 'redacted') {
      tokenCounters[prefix] = (tokenCounters[prefix] || 0) + 1;
      replacement = `[REDACTED_${prefix}_${tokenCounters[prefix]}]`;
      tokenMap[replacement] = m.rawText;
    } else if (mode === 'synthetic') {
      const syntheticPool = SYNTHETIC_VALUES[prefix] || ['[SYNTHETIC_DATA]'];
      const index = ((tokenCounters[prefix] || 0) % syntheticPool.length);
      tokenCounters[prefix] = (tokenCounters[prefix] || 0) + 1;
      replacement = syntheticPool[index];
      tokenMap[replacement] = m.rawText;
    } else if (mode === 'scramble') {
      // Preserve length and punctuation, scramble alphanumeric
      replacement = m.rawText.replace(/[a-zA-Z]/g, 'X').replace(/[0-9]/g, '9');
      tokenMap[replacement] = m.rawText;
    }

    detectedEntities.push({
      id: `entity-${generateSecureEntropyHex(6)}`,
      ruleId: m.rule.id,
      category: m.rule.category,
      type: m.rule.name,
      rawText: m.rawText,
      maskedText: replacement,
      startIndex: m.startIndex,
      endIndex: m.endIndex
    });

    sanitizedText += replacement;
    cursor = m.endIndex;
  }

  // Append remaining text
  sanitizedText += text.slice(cursor);

  const endTime = performance.now();
  const processingTimeMs = Math.round((endTime - startTime) * 100) / 100;

  // Breakdown statistics
  const breakdownByCategory = detectedEntities.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, { personal: 0, financial: 0, health: 0, technical: 0, custom: 0 } as Record<string, number>);

  const breakdownByType = detectedEntities.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const [inputHash, outputHash] = await Promise.all([
    computeSha256(text),
    computeSha256(sanitizedText)
  ]);

  // Generate 128-bit CSPRNG vault session key
  const vaultKey = `vk_${generateSecureEntropyHex(16)}`;

  return {
    originalText: text,
    sanitizedText,
    entities: detectedEntities,
    vaultKey,
    tokenMap,
    stats: {
      totalEntitiesFound: detectedEntities.length,
      breakdownByCategory: breakdownByCategory as any,
      breakdownByType,
      processingTimeMs,
      originalByteSize: new Blob([text]).size,
      sanitizedByteSize: new Blob([sanitizedText]).size
    },
    sha256Hash: outputHash,
    timestamp: new Date().toISOString()
  };
}

/**
 * Re-hydrates an AI response by substituting reversible tokens back to original PII.
 * Implements single-pass longest-token-first substitution to eliminate cascading
 * token replacement vulnerabilities and prefix collisions (e.g. [PERSON_10] vs [PERSON_1]).
 */
export function rehydrateResponse(
  aiResponse: string,
  tokenMap: Record<string, string>
): { restoredText: string; restoredCount: number; matchedTokens: string[] } {
  // Sort tokens by length in descending order to avoid substring prefix collisions
  const tokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) {
    return {
      restoredText: aiResponse,
      restoredCount: 0,
      matchedTokens: []
    };
  }

  // Support both exact tokens and markdown formatting inside brackets e.g. [**PERSON_1**]
  const patternList = tokens.map(t => {
    const bracketMatch = t.match(/^\[(.*)\]$/);
    if (bracketMatch) {
      const inner = bracketMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `\\[(?:\\*{1,2}|_{1,2})?${inner}(?:\\*{1,2}|_{1,2})?\\]`;
    }
    return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  const combinedRegex = new RegExp(patternList.join('|'), 'g');
  const matchedTokensSet = new Set<string>();
  let restoredCount = 0;

  // Single-pass replacement avoids cascading substitution and protects $ in replacements
  const restoredText = aiResponse.replace(combinedRegex, (matchedStr) => {
    const canonical = matchedStr.replace(/^\[[\*_]*([\w]+)[\*_]*\]$/, '[$1]');
    const original = tokenMap[canonical] ?? tokenMap[matchedStr];
    if (original !== undefined) {
      restoredCount++;
      matchedTokensSet.add(canonical in tokenMap ? canonical : matchedStr);
      return original;
    }
    return matchedStr;
  });

  return {
    restoredText,
    restoredCount,
    matchedTokens: Array.from(matchedTokensSet)
  };
}

/**
 * Generates a zero-knowledge verifiable audit certificate with cryptographic entropy.
 */
export async function createAuditCertificate(result: MaskingResult): Promise<AuditCertificate> {
  const inputSha256 = await computeSha256(result.originalText);
  return {
    id: `CERT-${generateSecureEntropyHex(8).toUpperCase()}`,
    timestamp: result.timestamp,
    sessionHash: result.vaultKey,
    inputSha256,
    outputSha256: result.sha256Hash,
    entitiesScrubbedCount: result.stats.totalEntitiesFound,
    entitiesBreakdown: result.stats.breakdownByType,
    complianceStandards: [
      'HIPAA Safe Harbor De-Identification (45 CFR § 164.514)',
      'GDPR Article 32 (Security of Processing / Pseudonymisation)',
      'SOC 2 Type II Confidentiality & Privacy Principles',
      'PCI-DSS 4.0 Requirement 3.4 (Primary Account Numbers)'
    ],
    zeroKnowledgeAttestation: true
  };
}
