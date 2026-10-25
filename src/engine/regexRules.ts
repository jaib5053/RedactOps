import { EntityRule } from '../types';

export const DEFAULT_RULES: EntityRule[] = [
  // 1. Social Security Number (SSN) & Tax ID
  {
    id: 'ssn',
    name: 'Social Security Number (SSN)',
    description: 'Matches standard 9-digit US Social Security Numbers and TINs',
    category: 'personal',
    regex: /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,
    tokenPrefix: 'SSN',
    example: '123-45-6789',
    enabled: true,
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  // 2. Credit Card Numbers (Visa, MasterCard, Amex, Discover)
  {
    id: 'credit_card',
    name: 'Credit Card Numbers',
    description: 'Matches Visa, MasterCard (including 2-series BINs), Amex, Discover with or without delimiters',
    category: 'financial',
    regex: /\b(?:4[0-9]{3}(?:[- ]?[0-9]{4}){3}|5[1-5][0-9]{2}(?:[- ]?[0-9]{4}){3}|2[2-7][0-9]{2}(?:[- ]?[0-9]{4}){3}|3[47][0-9]{2}[- ]?[0-9]{6}[- ]?[0-9]{5}|3(?:0[0-5]|[68][0-9])[0-9](?:[- ]?[0-9]{6}[- ]?[0-9]{4}|(?:[- ]?[0-9]{4}){3})|6(?:011|5[0-9]{2})(?:[- ]?[0-9]{4}){3})\b/g,
    tokenPrefix: 'CARD',
    example: '4532-1234-5678-9012',
    enabled: true,
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  // 3. Email Addresses (RFC 5321 length-bounded, ReDoS-proof)
  {
    id: 'email',
    name: 'Email Addresses',
    description: 'Standard RFC-compliant corporate & personal email patterns',
    category: 'personal',
    regex: /\b[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}\b/g,
    tokenPrefix: 'EMAIL',
    example: 'alex.rivera@meridian-health.org',
    enabled: true,
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  },
  // 4. Phone Numbers (Lookbehind boundary rejects hyphenated and word prefixes, prevents splitting account IDs)
  {
    id: 'phone',
    name: 'Phone Numbers',
    description: 'US formats and international E.164 phone numbers with strict boundary checks',
    category: 'personal',
    regex: /(?<![\w\-])(?:(?:\+?1[-. ]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[-. ]?\d{3}[-. ]?\d{4}|\+\d{1,3}[-. ]\d{2,4}[-. ]\d{3,4}[-. ]\d{3,4})\b/g,
    tokenPrefix: 'PHONE',
    example: '(555) 382-9102',
    enabled: true,
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  // 5. Cloud API Keys, Passwords & Secrets
  {
    id: 'api_keys',
    name: 'Cloud API Keys & Secrets',
    description: 'API keys, tokens, passwords, and authentication credentials',
    category: 'technical',
    regex: /\b(?:(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,99}|sk-ant-(?:api\d{2}-)?[a-zA-Z0-9_\-]{32,128}|sk-(?:proj-)?[a-zA-Z0-9_\-]{32,128}|(?:AKIA|ASIA)[0-9A-Z]{16}|gh[pousr]_[a-zA-Z0-9]{36,255}|AIza[0-9A-Za-z_\-]{33,40})\b|\b(?:password|passwd|pwd|passcode)(?:[\s:#=]+|(?:\s+is\s+))([^\s,;]{6,64})/gi,
    tokenPrefix: 'API_KEY',
    example: 'AKIAIOSFODNN7EXAMPLE',
    enabled: true,
    color: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
  // 6. JSON Web Tokens (JWT)
  {
    id: 'jwt',
    name: 'JSON Web Tokens (JWT)',
    description: 'Base64URL encoded 3-part authentication tokens',
    category: 'technical',
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    tokenPrefix: 'JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    enabled: true,
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  // 7. IPv4 & IPv6 Addresses
  {
    id: 'ip_address',
    name: 'IP Addresses (v4/v6)',
    description: 'Internal and external internet protocol addresses',
    category: 'technical',
    regex: /(?<![0-9a-zA-Z:]|(?:\d\.))(?:(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])|(?<!:)(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})(?![0-9a-zA-Z:]|(?:\.\d))/g,
    tokenPrefix: 'IP_ADDR',
    example: '192.168.1.45',
    enabled: true,
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  // 8. Medical Record Numbers & Health IDs (MRN / Patient / Insurance)
  {
    id: 'mrn',
    name: 'Medical Record Numbers (MRN)',
    description: 'Hospital patient identifiers, chart numbers, and insurance member IDs',
    category: 'health',
    regex: /\b(?:MRN|Patient\s*(?:reference(?:\s*number)?|ID|#|number|account)|Chart\s*#|MedRec|insurance\s*(?:member\s*)?ID|member\s*ID)(?:[\s:#-]+|(?:\s+is\s+))([A-Z0-9][A-Z0-9-]{4,14}[A-Z0-9])\b/gi,
    tokenPrefix: 'MRN',
    example: 'MRN: MED-894102',
    enabled: true,
    color: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
  },
  // 9. Dates of Birth (DOB) - includes natural language dates (e.g., 14 February 1992)
  {
    id: 'dob',
    name: 'Date of Birth (DOB)',
    description: 'Explicit birthdate strings in clinical and legal notes',
    category: 'personal',
    regex: /\b(?:DOB|Birthdate|Date of Birth|born)(?:[\s:#]+|(?:\s+is\s+)|(?:\s+on\s+))(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/gi,
    tokenPrefix: 'DOB',
    example: 'DOB: 05/14/1982',
    enabled: true,
    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
  },
  // 10. Bank Account / Routing / IBAN
  {
    id: 'iban',
    name: 'Bank Account / IBAN',
    description: 'International bank accounts (IBAN), domestic bank accounts, and routing numbers',
    category: 'financial',
    regex: /\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9A-Z]{2,4}){4,8}\b|\b(?:bank\s*account(?:\s*number)?|routing(?:\s*number)?)(?:[\s:#]+|(?:\s+is\s+))([0-9]{8,18})\b/gi,
    tokenPrefix: 'IBAN',
    example: 'GB29 NWBK 6016 1331 9268 19',
    enabled: true,
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  },
  // 11. Street Addresses
  {
    id: 'street_address',
    name: 'Physical Street Addresses',
    description: 'Physical location street numbers and standard thoroughfare suffixes',
    category: 'personal',
    regex: /\b\d{1,5}\s+(?:[A-Za-z0-9.-]{1,32}\s+){1,4}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way|Terrace|Ter|Parkway|Pkwy|Place|Pl|Circle|Cir|Highway|Hwy|Loop|Square|Sq)\b/gi,
    tokenPrefix: 'ADDRESS',
    example: '742 Evergreen Terrace',
    enabled: true,
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
  },
  // 12. Full Names (Contextual Mentions & Introductory Phrasing)
  {
    id: 'names_contextual',
    name: 'Names (Contextual Mentions)',
    description: 'Personal names identified via introductory phrasing, relationships, professional roles, or honorific titles',
    category: 'personal',
    regex: /\b(?:(?:(?:My\s+)?(?:full\s+)?(?:legal\s+)?name\s+is)|(?:(?:usually\s+)?go\s+by)|(?:(?:My\s+)?manager\s+is)|(?:(?:emergency\s+)?contact(?:\s+is)?(?:\s+my\s+)?(?:sister|brother|spouse|husband|wife|mother|father|partner|friend)?)|(?:(?:My\s+)?(?:sister|brother|spouse|husband|wife|mother|father|partner))|(?:recipient(?:\s+name)?\s+is)|(?:physician|doctor|clinician|nurse)\s+is\s+(?:Dr\.\s+)?|Patient|Client|Attorney|Plaintiff|Defendant|Dr\.|Mr\.|Mrs\.|Ms\.|Miss|Prof\.|CEO|CFO|COO|CTO|VP|Officer|Judge)(?:[\s:#]+|(?:\s+is\s+)|(?:\s*,\s*))(?!(?:Session|Token|Secret|Payload|Config|Service|Database|Server|ID|Audit|Response|Summary|Key|Certificate|Protocol|The|A|An|This|That|These|Those)\b)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b|\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?=,?\s+born\b)/g,
    tokenPrefix: 'PERSON',
    example: 'My name is Alexandra Morgan',
    enabled: true,
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
  },
  // 13. Government & Identity Documents (Passport, Driver's License)
  {
    id: 'gov_id',
    name: 'Government ID & Driver License',
    description: 'Passports, driver licenses, and national ID cards',
    category: 'personal',
    regex: /\b(?:passport(?:\s*number)?|driver'?s\s*license(?:\s*number)?|DL\s*#|national\s*ID)(?:[\s:#]+|(?:\s+is\s+))([A-Z0-9][A-Z0-9-]{6,16})\b/gi,
    tokenPrefix: 'GOV_ID',
    example: 'Passport: X12345678',
    enabled: true,
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  },
  // 14. Customer & Account Identifiers (CUST-, ACC-, EMP-, REC-)
  {
    id: 'account_ref',
    name: 'Account & Customer Identifiers',
    description: 'Customer reference codes, internal account numbers, and employee badges',
    category: 'financial',
    regex: /\b(?:(?:customer\s*reference(?:\s*number)?|account\s*number|employee\s*ID|recovery\s*reference)(?:[\s:#]+|(?:\s+is\s+))([A-Z0-9][A-Z0-9-]{4,20}))\b|\b(?:CUST|ACC|EMP|REC)-[0-9A-Z]{4,14}(?:-[0-9A-Z]{4})?\b/gi,
    tokenPrefix: 'ACCT_ID',
    example: 'CUST-8492-1736',
    enabled: true,
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  },
  // 15. Device, Fingerprint & Telemetry Identifiers
  {
    id: 'device_telemetry',
    name: 'Device & Telemetry Identifiers',
    description: 'Hardware fingerprints, device serials, and GPS coordinates',
    category: 'technical',
    regex: /\b(?:DEVICE-[A-Z0-9_-]{6,24}|fp_[a-zA-Z0-9_-]{8,32})\b|\b[-+]?(?:[1-8]?\d\.\d{3,8}|90\.0{3,8}),\s*[-+]?(?:180\.0{3,8}|(?:1[0-7]\d|\d{1,2})\.\d{3,8})\b/gi,
    tokenPrefix: 'DEVICE',
    example: 'DEVICE-ANDROID-773821',
    enabled: true,
    color: 'bg-lime-500/20 text-lime-300 border-lime-500/30'
  },
  // 16. Usernames & Security Answers
  {
    id: 'credentials_meta',
    name: 'Usernames & Security Answers',
    description: 'User login handles, usernames, and security question answers',
    category: 'personal',
    regex: /\b(?:username|user\s*id|login\s*id)(?:[\s:#]+|(?:\s+is\s+))([a-zA-Z0-9._-]{5,32})\b|\b(?:answer\s+was\s+)[“"']?([A-Za-z0-9_-]{3,32})[”"']?/gi,
    tokenPrefix: 'USER_ID',
    example: 'username: alexmorgan92',
    enabled: true,
    color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
  }
];

export const SYNTHETIC_VALUES: Record<string, string[]> = {
  PERSON: ['Jordan Hayes', 'Taylor Brooks', 'Morgan Vance', 'Casey Bennett', 'Alex Chen', 'Samira Patel'],
  EMAIL: ['user491@company-safe.net', 'client-demo@anonymized.org', 'contact@safe-preview.io'],
  PHONE: ['(555) 019-2834', '(555) 018-9923', '(555) 012-7711'],
  SSN: ['999-01-0001', '999-01-0002', '999-01-0003'],
  CARD: ['4000-0012-3456-7890', '5105-1051-0510-5100'],
  ADDRESS: ['100 Main Street, Suite 400', '500 Enterprise Way, Floor 2'],
  API_KEY: ['DEMO_REDACTED_API_KEY_0000', 'AKIA_SAMPLE_SAFE_KEY_1234'],
  JWT: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzYWZlIn0.c2lnbmF0dXJl'],
  IP_ADDR: ['10.0.0.1', '172.16.0.1', '192.168.0.100'],
  MRN: ['MRN-000-000000'],
  DOB: ['01/01/1990'],
  IBAN: ['XX00 TEST 0000 0000 0000 00'],
  GOV_ID: ['X98765432', 'D987-6543-2100'],
  ACCT_ID: ['CUST-0000-0000', 'ACC-0000000000'],
  DEVICE: ['fp_safe_device_0000', 'DEVICE-SAFE-000000'],
  USER_ID: ['user_safe_test', 'SafeAnswer']
};
