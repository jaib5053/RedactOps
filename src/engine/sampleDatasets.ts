import { SampleDataset } from '../types';

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'healthcare',
    title: 'Healthcare Discharge & Clinical EHR',
    category: 'HIPAA & Medical',
    description: 'Patient medical record with MRN, SSN, DOB, physician notes, and contact details.',
    content: `DISCHARGE SUMMARY & CLINICAL EHR NOTE
Facility: St. Jude Metropolitan Hospital
Patient: Jonathan Hastings | MRN: MED-894102
DOB: 05/14/1982 | SSN: 123-45-6789
Phone: (555) 382-9102 | Email: jonathan.hastings@outlook.com
Address: 742 Evergreen Terrace, Springfield, OR 97477

Attending Physician: Dr. Sarah Vance, MD
Diagnosis: Acute bacterial pneumonia with secondary hypertension.

Medications Prescribed:
1. Azithromycin 500mg daily for 5 days.
2. Lisinopril 10mg once daily.

Clinical Narrative:
Patient Jonathan Hastings was admitted following acute respiratory distress. Diagnostic lab results were reviewed with Dr. Sarah Vance. The patient authorized disclosure to his emergency contact via phone at (555) 912-3341. Next follow-up clinic appointment scheduled in 14 days at the Springfield Outpatient Center.`
  },
  {
    id: 'financial',
    title: 'Financial M&A Due Diligence & Wire Audit',
    category: 'Finance & Banking',
    description: 'Corporate ledger export with bank accounts, IBANs, corporate cards, and transaction records.',
    content: `CONFIDENTIAL M&A TRANSACTION AUDIT
Project Apollo: Target Entity "Vertex Logistics LLC"
Prepared for Investment Committee Review

Primary Settlement Account:
Bank: Barclays Commercial UK
Account Holder: Vertex Logistics International Ltd
IBAN: GB29 NWBK 6016 1331 9268 19
Routing / Sort Code: 60-16-13

Corporate Credit Cards Issued to C-Suite:
- CEO Marcus Sterling: 4532-1234-5678-9012 (Visa Signature)
- CFO Helena Drake: 5105-1051-0510-5100 (MasterCard Business)
- Wire Coordinator: helena.drake@vertexlogistics.co.uk | Direct: (555) 723-9912

Escrow Holdback Agreement:
A mandatory escrow deposit of $2,450,000 has been initiated from escrow account referencing SSN 451-92-3819 for tax indemnification.`
  },
  {
    id: 'technical',
    title: 'DevOps Incident Post-Mortem & Server Logs',
    category: 'DevOps & Security',
    description: 'Production bug log with leaked cloud credentials, API tokens, JWTs, and internal IPs.',
    content: `[2026-10-24T03:14:02.192Z] ERROR [auth-service] Authentication handshake timeout
Request origin: 192.168.1.45 (remote: 10.240.12.89)
Client Session Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfODkyOTQiLCJlbWFpbCI6ImFkbWluQGNsb3Vkc3luYy5pbyIsInJvbGUiOiJzdXBlcmFkbWluIn0.Kx289jsdf823_9238jdsf

CRITICAL LEAK DETECTED IN ENVIRONMENT DUMP:
AUTH_SECRET_TOKEN=ghp_MockGitHubPersonalAccessToken36Chars
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
OPENAI_API_TOKEN=sk-ant-api03-Kx98234-92384729384729384729384729384
SERVER_GATEWAY_IP=172.16.254.1

Stack trace initiated by engineer: devops-lead@enterprise-corp.net (mobile: 555-829-1002)`
  },
  {
    id: 'legal',
    title: 'Legal Deposition & Witness Transcript',
    category: 'Legal & Compliance',
    description: 'Courtroom testimony with protected witness identities, home addresses, and private contracts.',
    content: `UNITED STATES DISTRICT COURT - SOUTHERN DISTRICT OF NEW YORK
Case No. 24-CV-9821-JSR
In re: Apex Pharmaceuticals Antitrust Litigation

EXAMINATION OF WITNESS:
Attorney Rachel Morrison: Please state your full legal name and current residence for the record.
Witness: My name is Client David Steinberg. I reside at 1440 Ocean Parkway, Brooklyn, NY 11230.
Attorney Rachel Morrison: What was your primary contact email during your tenure at Apex?
Witness: It was david.steinberg@apexpharma-corp.com, and my private line was (555) 438-2991.
Attorney Rachel Morrison: And did you authorize the financial transfer of $450,000 associated with SSN 092-41-8821 on November 12th?
Witness: Yes, as documented under witness docket #NY-88912.`
  }
];
