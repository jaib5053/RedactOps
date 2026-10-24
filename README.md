# RedactOps 🛡️
> **Zero-Knowledge In-Browser Data Anonymization & Reversible Masking for Enterprise AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stack: Vite + React 19 + TypeScript](https://img.shields.io/badge/Stack-React%2019%20%2B%20TypeScript-sky.svg)](https://react.dev)
[![Compliance: HIPAA & GDPR](https://img.shields.io/badge/Compliance-HIPAA%20Safe%20Harbor%20%7C%20GDPR%20Art.%2032-emerald.svg)](#compliance)
[![Architecture: 0 Bytes Egress](https://img.shields.io/badge/Architecture-100%25%20In--Browser%20Client--Side-purple.svg)](#architecture)

---

## 💡 Overview

**RedactOps** solves the enterprise AI compliance bottleneck. Knowledge workers in healthcare, finance, legal, and software engineering are prohibited from pasting client data, records, or credentials into public LLMs like ChatGPT, Claude, and Gemini.

RedactOps executes **100% client-side in the browser** using WebAssembly, Web Workers, and the native Web Crypto API. Sensitive PII/PHI is sanitized locally into structured tokens (e.g. `[PERSON_1]`, `[CARD_1]`). Once the AI returns an answer, RedactOps' **Reversible Masking Vault** restores the real names and records with a single click—without OpenAI or Anthropic ever seeing the raw data.

---

## ⚡ Key Features

1. **Prompt & Text Sanitizer Studio:**
   - Multi-mode redaction: `Tokenized [PERSON_1]`, `Redacted [REDACTED_SSN]`, `Synthetic (Realistic Fake Data)`, and `Format-Preserving Scramble`.
   - Built-in compliance detectors for SSNs, credit cards, emails, phone numbers, API keys (AWS/Stripe/OpenAI), JWTs, IP addresses, HIPAA Medical Record Numbers (MRN), dates of birth, IBANs, and street addresses.
   - Pre-loaded enterprise test scenarios: Healthcare EHR, Financial Due Diligence, DevOps Incident Logs, and Legal Transcripts.

2. **Reversible De-Masking Vault:**
   - Local in-memory cryptographic key mapping.
   - Paste AI responses containing tokens; one click restores real client identities locally.

3. **Batch CSV & Tabular Cleaner:**
   - In-browser parsing of CSV and TSV spreadsheets.
   - Real-time cell-by-cell redaction and instant safe CSV export without server upload.

4. **Custom Regex & Proprietary Rule Configurator:**
   - Live testing sandbox to define custom patterns for internal project codenames, employee badge IDs, or confidential customer identifiers.

5. **Verifiable Compliance Audit Certificates:**
   - Generates cryptographic audit proofs with SHA-256 digests of raw inputs and sanitized outputs for legal and compliance records.

6. **Chrome Extension Companion:**
   - Injects a floating shield badge directly into ChatGPT, Claude, and Gemini interfaces for one-click prompt scrubbing.

---

## 🚀 Quickstart & Development

### 1. Install & Build
```bash
# Install dependencies
npm install --legacy-peer-deps

# Run local development server
npm run dev

# Build production bundle
npm run build
```

The production bundle compiles to `dist/` and is 100% static, ready for instant zero-config deployment to **Cloudflare Pages**, **Vercel**, or **AWS S3/CloudFront**.

### 2. Loading the Companion Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the `extension/` folder inside this repository.
4. Open [ChatGPT](https://chatgpt.com) or [Claude](https://claude.ai) to see the live inline shield badge!

---

## 🏗️ Technical Architecture & Margins

```
                      END-USER BROWSER
    ┌─────────────────────────────────────────────────────┐
    │  React 19 + Tailwind CSS + Lucide Icons             │
    │  Web Worker + WebAssembly Regex Finite Automata     │
    │  Web Crypto API (AES-256-GCM / SHA-256)             │
    └──────────────────────────┬──────────────────────────┘
                               │
            Auth & Licensing Only (0 Payload Egress)
                               │
                               ▼
    ┌─────────────────────────────────────────────────────┐
    │  Cloudflare Pages / Workers (Global Edge CDN)       │
    │  Supabase (Team rule configs & licensing metadata)   │
    └─────────────────────────────────────────────────────┘
```

* **Gross Margin:** **96% - 98%** (Zero server GPU or compute costs for document processing).
* **Monthly Infrastructure Run Rate:** **< $35/month** up to 100,000+ active users.

---

## 📜 License
MIT License. Created for high-margin solo-developer execution.
