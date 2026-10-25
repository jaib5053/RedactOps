// RedactOps Client-Side Content Script
// Secure In-Browser Zero-Knowledge Prompt Sanitizer for ChatGPT, Claude, and Gemini

(function() {
  'use strict';

  // Prevent multiple injections
  if (document.getElementById('redactops-shield-root')) {
    return;
  }

  // Hardened, ReDoS-resistant regular expression patterns matching main engine rules
  const REGEX_RULES = [
    {
      key: 'SSN',
      regex: /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g
    },
    {
      key: 'CARD',
      regex: /\b(?:4[0-9]{3}(?:[- ]?[0-9]{4}){3}|5[1-5][0-9]{2}(?:[- ]?[0-9]{4}){3}|2[2-7][0-9]{2}(?:[- ]?[0-9]{4}){3}|3[47][0-9]{2}[- ]?[0-9]{6}[- ]?[0-9]{5}|3(?:0[0-5]|[68][0-9])[0-9](?:[- ]?[0-9]{6}[- ]?[0-9]{4}|(?:[- ]?[0-9]{4}){3})|6(?:011|5[0-9]{2})(?:[- ]?[0-9]{4}){3})\b/g
    },
    {
      key: 'EMAIL',
      regex: /\b[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}\b/g
    },
    {
      key: 'PHONE',
      regex: /(?<![\w\-])(?:(?:\+?1[-. ]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[-. ]?\d{3}[-. ]?\d{4}|\+\d{1,3}[-. ]\d{2,4}[-. ]\d{3,4}[-. ]\d{3,4})\b/g
    },
    {
      key: 'API_KEY',
      regex: /\b(?:(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,99}|sk-ant-(?:api\d{2}-)?[a-zA-Z0-9_\-]{32,128}|sk-(?:proj-)?[a-zA-Z0-9_\-]{32,128}|(?:AKIA|ASIA)[0-9A-Z]{16}|gh[pousr]_[a-zA-Z0-9]{36,255}|AIza[0-9A-Za-z_\-]{33,40})\b|\b(?:password|passwd|pwd|passcode)(?:[\s:#=]+|(?:\s+is\s+))([^\s,;]{6,64})/gi
    },
    {
      key: 'JWT',
      regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
    },
    {
      key: 'IP_ADDR',
      regex: /(?<![0-9a-zA-Z:]|(?:\d\.))(?:(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])|(?<!:)(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})(?![0-9a-zA-Z:]|(?:\.\d))/g
    },
    {
      key: 'MRN',
      regex: /\b(?:MRN|Patient\s*(?:reference(?:\s*number)?|ID|#|number|account)|Chart\s*#|MedRec|insurance\s*(?:member\s*)?ID|member\s*ID)(?:[\s:#-]+|(?:\s+is\s+))([A-Z0-9][A-Z0-9-]{4,14}[A-Z0-9])\b/gi
    },
    {
      key: 'DOB',
      regex: /\b(?:DOB|Birthdate|Date of Birth|born)(?:[\s:#]+|(?:\s+is\s+)|(?:\s+on\s+))(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/gi
    },
    {
      key: 'IBAN',
      regex: /\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9A-Z]{2,4}){4,8}\b|\b(?:bank\s*account(?:\s*number)?|routing(?:\s*number)?)(?:[\s:#]+|(?:\s+is\s+))([0-9]{8,18})\b/gi
    },
    {
      key: 'ADDRESS',
      regex: /\b\d{1,5}\s+(?:[A-Za-z0-9.-]{1,32}\s+){1,4}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way|Terrace|Ter|Parkway|Pkwy|Place|Pl|Circle|Cir|Highway|Hwy|Loop|Square|Sq)\b/gi
    },
    {
      key: 'PERSON',
      regex: /\b(?:(?:(?:My\s+)?(?:full\s+)?(?:legal\s+)?name\s+is)|(?:(?:usually\s+)?go\s+by)|(?:(?:My\s+)?manager\s+is)|(?:(?:emergency\s+)?contact(?:\s+is)?(?:\s+my\s+)?(?:sister|brother|spouse|husband|wife|mother|father|partner|friend)?)|(?:(?:My\s+)?(?:sister|brother|spouse|husband|wife|mother|father|partner))|(?:recipient(?:\s+name)?\s+is)|(?:physician|doctor|clinician|nurse)\s+is\s+(?:Dr\.\s+)?|Patient|Client|Attorney|Plaintiff|Defendant|Dr\.|Mr\.|Mrs\.|Ms\.|Miss|Prof\.|CEO|CFO|COO|CTO|VP|Officer|Judge)(?:[\s:#]+|(?:\s+is\s+)|(?:\s*,\s*))(?!(?:Session|Token|Secret|Payload|Config|Service|Database|Server|ID|Audit|Response|Summary|Key|Certificate|Protocol|The|A|An|This|That|These|Those)\b)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b|\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?=,?\s+born\b)/g
    },
    {
      key: 'GOV_ID',
      regex: /\b(?:passport(?:\s*number)?|driver'?s\s*license(?:\s*number)?|DL\s*#|national\s*ID)(?:[\s:#]+|(?:\s+is\s+))([A-Z0-9][A-Z0-9-]{6,16})\b/gi
    },
    {
      key: 'ACCT_ID',
      regex: /\b(?:(?:customer\s*reference(?:\s*number)?|account\s*number|employee\s*ID|recovery\s*reference)(?:[\s:#]+|(?:\s+is\s+))([A-Z0-9][A-Z0-9-]{4,20}))\b|\b(?:CUST|ACC|EMP|REC)-[0-9A-Z]{4,14}(?:-[0-9A-Z]{4})?\b/gi
    },
    {
      key: 'DEVICE',
      regex: /\b(?:DEVICE-[A-Z0-9_-]{6,24}|fp_[a-zA-Z0-9_-]{8,32})\b|\b[-+]?(?:[1-8]?\d\.\d{3,8}|90\.0{3,8}),\s*[-+]?(?:180\.0{3,8}|(?:1[0-7]\d|\d{1,2})\.\d{3,8})\b/gi
    },
    {
      key: 'USER_ID',
      regex: /\b(?:username|user\s*id|login\s*id)(?:[\s:#]+|(?:\s+is\s+))([a-zA-Z0-9._-]{5,32})\b|\b(?:answer\s+was\s+)[“"']?([A-Za-z0-9_-]{3,32})[”"']?/gi
    }
  ];

  /**
   * Sanitizes text using non-overlapping positional resolution to prevent token collision.
   */
  function sanitizePromptText(text) {
    if (!text || typeof text !== 'string') return { sanitized: text, total: 0 };

    const matches = [];

    for (const rule of REGEX_RULES) {
      const re = new RegExp(rule.regex.source, rule.regex.flags);
      let match;
      while ((match = re.exec(text)) !== null) {
        let rawText = match[0];
        let startIndex = match.index;
        const capturedGroup = match.slice(1).find(g => g !== undefined);
        if (capturedGroup !== undefined) {
          rawText = capturedGroup;
          const offset = match[0].indexOf(capturedGroup);
          if (offset !== -1) {
            startIndex = match.index + offset;
          }
        }
        matches.push({
          key: rule.key,
          rawText,
          startIndex,
          endIndex: startIndex + rawText.length
        });
        if (re.lastIndex === match.index) {
          re.lastIndex++;
        }
      }
    }

    // Name propagation pass: propagate contextually identified full names across document
    const personMatches = matches.filter(m => m.key === 'PERSON' && m.rawText.includes(' '));
    const uniqueFullNames = Array.from(new Set(personMatches.map(m => m.rawText)));

    for (const fullName of uniqueFullNames) {
      const escaped = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(`\\b${escaped}\\b`, 'g');
      let nm;
      while ((nm = nameRegex.exec(text)) !== null) {
        const startIndex = nm.index;
        const endIndex = startIndex + nm[0].length;
        if (!matches.some(m => m.startIndex === startIndex && m.endIndex === endIndex)) {
          matches.push({
            key: 'PERSON',
            rawText: nm[0],
            startIndex,
            endIndex
          });
        }
        if (nameRegex.lastIndex === nm.index) {
          nameRegex.lastIndex++;
        }
      }
    }

    // Resolve overlaps with greedy longest-match priority
    const sortedByPriority = [...matches].sort((a, b) => {
      const lenA = a.endIndex - a.startIndex;
      const lenB = b.endIndex - b.startIndex;
      if (lenB !== lenA) {
        return lenB - lenA;
      }
      return a.startIndex - b.startIndex;
    });

    const nonOverlapping = [];
    for (const candidate of sortedByPriority) {
      const hasOverlap = nonOverlapping.some(
        sel => candidate.startIndex < sel.endIndex && candidate.endIndex > sel.startIndex
      );
      if (!hasOverlap) {
        nonOverlapping.push(candidate);
      }
    }

    nonOverlapping.sort((a, b) => a.startIndex - b.startIndex);

    let sanitized = '';
    let cursor = 0;
    const counters = {};
    const reverseMap = {};

    for (const m of nonOverlapping) {
      sanitized += text.slice(cursor, m.startIndex);
      let token = '';
      if (reverseMap[m.rawText]) {
        token = reverseMap[m.rawText];
      } else {
        counters[m.key] = (counters[m.key] || 0) + 1;
        token = `[${m.key}_${counters[m.key]}]`;
        reverseMap[m.rawText] = token;
      }
      sanitized += token;
      cursor = m.endIndex;
    }
    sanitized += text.slice(cursor);

    return {
      sanitized,
      total: nonOverlapping.length
    };
  }

  /**
   * Locates the active prompt input across ChatGPT, Claude, and Gemini.
   */
  function findActiveInput() {
    // 1. Prioritize document.activeElement if user is actively focused on an input
    const active = document.activeElement;
    if (active && (
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'INPUT' ||
      active.isContentEditable ||
      active.getAttribute('contenteditable') === 'true'
    )) {
      return active;
    }

    // 2. ChatGPT prompt textarea / contenteditable
    const chatGptInput = document.querySelector('#prompt-textarea');
    if (chatGptInput) return chatGptInput;

    // 3. Claude ProseMirror rich-text editor
    const claudeInput = document.querySelector('div.ProseMirror[contenteditable="true"]');
    if (claudeInput) return claudeInput;

    // 4. Gemini rich textarea
    const geminiInput = document.querySelector('rich-textarea [contenteditable="true"], .textarea[contenteditable="true"]');
    if (geminiInput) return geminiInput;

    // 5. General fallback
    return document.querySelector('textarea, [contenteditable="true"]');
  }

  /**
   * Safely updates value in React/ProseMirror controlled editors.
   */
  function applySanitizedValue(element, sanitized) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(element, sanitized);
      } else {
        element.value = sanitized;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
      // Rich text contenteditable (Claude / Lexical / ProseMirror)
      element.focus();
      try {
        // Try execCommand for native undo history & editor framework sync
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, sanitized);
      } catch (err) {
        element.innerText = sanitized;
      }

      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: sanitized
      }));
    }
  }

  // Create host container with isolated Shadow DOM
  const host = document.createElement('div');
  host.id = 'redactops-shield-root';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Encapsulated Shadow DOM styling (immune to host page CSS conflicts)
  const style = document.createElement('style');
  style.textContent = `
    .shield-badge {
      position: fixed;
      bottom: 85px;
      right: 28px;
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0b0f19;
      color: #38bdf8;
      border: 1px solid #0284c7;
      padding: 7px 14px;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      user-select: none;
      transition: all 0.2s ease;
    }
    .shield-badge:hover {
      background: #0f172a;
      border-color: #38bdf8;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
    }
    .shield-badge:active {
      transform: translateY(0);
    }
    .shield-icon {
      font-size: 13px;
    }
    .toast-pill {
      position: fixed;
      bottom: 125px;
      right: 28px;
      z-index: 2147483647;
      background: #022c22;
      color: #34d399;
      border: 1px solid #059669;
      padding: 6px 12px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, monospace;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  shadow.appendChild(style);

  const badge = document.createElement('div');
  badge.className = 'shield-badge';
  badge.setAttribute('role', 'button');
  badge.setAttribute('title', 'RedactOps: Click to scrub PII from active prompt before sending to AI');
  badge.innerHTML = `
    <span class="shield-icon">🛡️</span>
    <span>Scrub PII</span>
  `;
  shadow.appendChild(badge);

  function showToast(message) {
    const existing = shadow.querySelector('.toast-pill');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-pill';
    toast.textContent = message;
    shadow.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  badge.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const target = findActiveInput();
    if (!target) {
      showToast('⚠️ No prompt input detected on this page.');
      return;
    }

    const currentText = (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')
      ? target.value
      : (target.innerText || target.textContent || '');

    if (!currentText || !currentText.trim()) {
      showToast('ℹ️ Prompt is empty. Type your message first.');
      return;
    }

    const { sanitized, total } = sanitizePromptText(currentText);

    if (total === 0) {
      showToast('✓ Clean: No sensitive PII detected in prompt.');
      return;
    }

    applySanitizedValue(target, sanitized);
    showToast(`🛡️ RedactOps: Scrubbed ${total} sensitive PII entities in-browser!`);
  });
})();
