export type EntityCategory = 'personal' | 'financial' | 'health' | 'technical' | 'custom';

export type MaskingMode = 'token' | 'redacted' | 'synthetic' | 'scramble';

export interface EntityRule {
  id: string;
  name: string;
  description: string;
  category: EntityCategory;
  regex: RegExp;
  tokenPrefix: string;
  example: string;
  enabled: boolean;
  isCustom?: boolean;
  color: string;
}

export interface DetectedEntity {
  id: string;
  ruleId: string;
  category: EntityCategory;
  type: string;
  rawText: string;
  maskedText: string;
  startIndex: number;
  endIndex: number;
}

export interface MaskingResult {
  originalText: string;
  sanitizedText: string;
  entities: DetectedEntity[];
  vaultKey: string;
  tokenMap: Record<string, string>; // e.g., "[PERSON_1]": "John Doe"
  stats: {
    totalEntitiesFound: number;
    breakdownByCategory: Record<EntityCategory, number>;
    breakdownByType: Record<string, number>;
    processingTimeMs: number;
    originalByteSize: number;
    sanitizedByteSize: number;
  };
  sha256Hash: string;
  timestamp: string;
}

export interface AuditCertificate {
  id: string;
  timestamp: string;
  sessionHash: string;
  inputSha256: string;
  outputSha256: string;
  entitiesScrubbedCount: number;
  entitiesBreakdown: Record<string, number>;
  complianceStandards: string[];
  zeroKnowledgeAttestation: boolean;
}

export interface SampleDataset {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
}
