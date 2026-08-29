// ─────────────────────────────────────────────────────────────
//  Mock Data — local/static data for the frontend-only build
//  Replace data sources here when connecting a real backend.
// ─────────────────────────────────────────────────────────────

export interface ScanResult {
  id:         string;
  content:    string;
  type:       'url' | 'email' | 'sms' | 'phone';
  risk:       'safe' | 'suspicious' | 'dangerous';
  confidence: number;        // 0-100
  timestamp:  Date;
  details?:   string;
  /** Whether this result came from the demo fallback (offline) vs live analysis. */
  isDemoFallback?: boolean;
}

export interface ChatMessage {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
}

export const MOCK_USER = {
  id:       'user-001',
  name:     '',
  email:    '',
  joinDate: new Date('2024-01-15'),
  avatar:   null as string | null,
};

export const MOCK_SCAN_HISTORY: ScanResult[] = [
  {
    id:         '1',
    content:    'http://paypal-secure-login.xyz/verify',
    type:       'url',
    risk:       'dangerous',
    confidence: 94,
    timestamp:  new Date(Date.now() - 1000 * 60 * 30),
    details:    'Domain is newly registered and mimics a well-known payment provider.',
  },
  {
    id:         '2',
    content:    'Your HBL account has been suspended. Click here to verify: bit.ly/h8l-update',
    type:       'sms',
    risk:       'suspicious',
    confidence: 78,
    timestamp:  new Date(Date.now() - 1000 * 60 * 60 * 2),
    details:    'Message uses urgency tactics and a URL shortener, common in phishing SMS.',
  },
  {
    id:         '3',
    content:    'https://www.google.com',
    type:       'url',
    risk:       'safe',
    confidence: 99,
    timestamp:  new Date(Date.now() - 1000 * 60 * 60 * 5),
    details:    'Domain is verified, long-established, and uses HTTPS.',
  },
  {
    id:         '4',
    content:    '+92 300 1234567 — Received suspicious call from this number',
    type:       'phone',
    risk:       'suspicious',
    confidence: 65,
    timestamp:  new Date(Date.now() - 1000 * 60 * 60 * 24),
    details:    'Pattern matches known scam numbers. Multiple user reports found.',
  },
];

export const MOCK_STATS = {
  scansToday:     3,
  totalScans:     47,
  threatsBlocked: 12,
};

// ── Sense AI mock Q&A pairs ─────────────────────────────────
export interface QAPair {
  pattern: RegExp;
  response: string;
  responseUr?: string;
}

export const AI_QA_PAIRS: QAPair[] = [
  {
    pattern: /phish|fake|scam|fraud/i,
    response:
      'Phishing is when someone pretends to be a trusted company to steal your personal information. Always check the sender\'s email address carefully — real companies use their official domain (like @bankname.com), never a random Gmail or strange domain.',
  },
  {
    pattern: /otp|one.time|password|pin/i,
    response:
      '⚠️ Never share your OTP, PIN, or password with anyone — not even someone claiming to be from your bank. Legitimate organizations will NEVER ask for these over the phone or SMS. If someone does, it\'s a scam. Hang up immediately.',
  },
  {
    pattern: /link|url|click|website/i,
    response:
      'Before clicking any link:\n1. Check the full URL carefully for misspellings (e.g., "paypa1.com")\n2. Hover over the link to see where it actually goes\n3. If it uses a URL shortener (bit.ly, tinyurl), be extra careful\n4. When in doubt, go directly to the official website by typing it yourself.',
  },
  {
    pattern: /bank|hbl|meezan|ubi|mcb|allied/i,
    response:
      'Banks will NEVER:\n• Ask for your PIN or full account number via SMS\n• Ask you to "verify" your account by clicking a link\n• Call you asking for your OTP\n\nIf you get such a call or message, hang up and call your bank directly using the number on the back of your card.',
  },
  {
    pattern: /safe|legitimate|real|genuine|trust/i,
    response:
      'To verify if something is legitimate:\n✓ Check the exact sender email address\n✓ Look for HTTPS in the URL (the padlock icon)\n✓ Search for the company\'s official website independently\n✓ Call the company directly using their official number\n✓ When in doubt, don\'t click — it\'s always safer to verify first.',
  },
  {
    pattern: /shared|gave|told|disclosed|already/i,
    response:
      "\u{1F6A8} If you've already shared sensitive information:\n1. Change your password immediately on the real website\n2. Call your bank right away to freeze your account if financial info was shared\n3. Enable two-factor authentication on your accounts\n4. Monitor your bank statements for unusual transactions\n5. Report the incident to your local cybercrime authority\n\nDon't panic \u2014 act quickly and you can minimize the damage.",
  },
];

export const AI_DEFAULT_RESPONSE =
  "That's a great question about online safety. As a general rule: if something feels suspicious or too good to be true, it probably is. Trust your instincts and always verify through official channels before taking any action. Is there something specific you'd like to know more about?";

// ── Sense AI suggestions ────────────────────────────────────
export const AI_SUGGESTIONS_EN = [
  'Is this link safe to click?',
  'How do I spot a phishing email?',
  'What should I do if I shared my password?',
  'Is this SMS from my bank real?',
  'How do scammers get my number?',
];

export const AI_SUGGESTIONS_UR = [
  'کیا یہ لنک کلک کرنا محفوظ ہے؟',
  'فشنگ ای میل کیسے پہچانیں؟',
  'اگر پاس ورڈ شیئر کر دیا تو کیا کروں؟',
  'کیا یہ ایس ایم ایس میرے بینک کا ہے؟',
  'اسکامر میرا نمبر کیسے جانتے ہیں؟',
];

// ── Safety tips ─────────────────────────────────────────────
export const SAFETY_TIPS_EN = [
  'Never share OTPs, PINs or passwords over the phone',
  'Banks never ask for your full account details via SMS',
  'Check URLs carefully before clicking — look for misspellings',
  'If in doubt, call the official number directly',
];

export const SAFETY_TIPS_UR = [
  'فون پر کبھی OTP، PIN یا پاس ورڈ شیئر نہ کریں',
  'بینک کبھی ایس ایم ایس سے مکمل اکاؤنٹ تفصیلات نہیں مانگتا',
  'کلک کرنے سے پہلے یو آر ایل غور سے چیک کریں',
  'شک ہو تو براہ راست سرکاری نمبر پر کال کریں',
];

// ═════════════════════════════════════════════════════════════
//  DEMO FALLBACK — Offline analysis when backend is unreachable
//
//  This is clearly separated from live backend analysis.
//  Every result is marked with `isDemoFallback: true`.
//  Deterministic: same input always produces the same output.
//  Used only when the backend /api/analyze endpoint is down.
// ═════════════════════════════════════════════════════════════

/**
 * Deterministic demo scenarios for common Pakistani phishing patterns.
 * Each scenario matches a specific real-world scam type.
 */
interface DemoScenario {
  /** Pattern that triggers this scenario */
  match:    RegExp;
  result:   Omit<ScanResult, 'id' | 'timestamp' | 'content' | 'isDemoFallback'>;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    // Scenario 1: Fake bank warning
    match: /\b(hbl|meezan|allied|mcb|ubl|bank alflah|faysal bank|standard chartered)\b.*\b(suspended|blocked|verify|update|confirm|frozen|restrict)/i,
    result: {
      type:       'sms',
      risk:       'dangerous',
      confidence: 92,
      details:    '[Demo] This matches a common bank impersonation scam. Real banks in Pakistan never ask you to verify your account via SMS link. Call your bank directly using the number on your card.',
    },
  },
  {
    // Scenario 2: Fake government / BISP message
    match: /\b(benazir|bisp|ehsaas|8171|government.*fund|wazir.*e.*azam|pakistan.*government)\b.*\b(prize|money|qist|payment|fund|nikli|aa gayi|mil gayi)/i,
    result: {
      type:       'sms',
      risk:       'dangerous',
      confidence: 88,
      details:    '[Demo] This matches a fake government programme scam. BISP/Ehsaas never sends unsolicited "you won money" messages. Visit 8171.bisp.gov.pk directly to check eligibility.',
    },
  },
  {
    // Scenario 3: Suspicious delivery link
    match: /\b(parcel|delivery|package|courier|tracking|tcs|leopards|dhl|fedex)\b.*\b(click|link|verify|confirm|update|bit\.ly|tinyurl|\.xyz|\.tk)/i,
    result: {
      type:       'sms',
      risk:       'suspicious',
      confidence: 74,
      details:    '[Demo] This looks like a delivery tracking scam. Always go to the courier\'s official website directly and enter your tracking number there — never click SMS links.',
    },
  },
  {
    // Scenario 4: OTP request scam
    match: /\b(otp|pin|password|code|verification)\b.*\b(send|share|reply|forward|bhej|bhejein|share karein)/i,
    result: {
      type:       'sms',
      risk:       'dangerous',
      confidence: 95,
      details:    '[Demo] This is asking you to share an OTP or code. No legitimate service ever asks you to send your OTP to someone. This is always a scam — block the sender.',
    },
  },
  {
    // Scenario 5: Legitimate transactional message
    match: /\b(transaction|spent|received|debited|credited|balance)\b.*\b(pkr|rs\.?|rupees|account)\b/i,
    result: {
      type:       'sms',
      risk:       'safe',
      confidence: 90,
      details:    '[Demo] This appears to be a standard bank transaction notification. These are normally legitimate. Verify the sender number matches your bank\'s official SMS number.',
    },
  },
];

/**
 * Infer content type for the demo fallback.
 */
function inferDemoType(content: string): ScanResult['type'] {
  const c = content.toLowerCase().trim();
  if (c.startsWith('http://') || c.startsWith('https://') || /^[\w-]+\.[a-z]{2,}/i.test(c)) return 'url';
  if (c.includes('@') && !c.startsWith('http')) return 'email';
  if (/^\+?[\d\s\-()]+$/.test(content.trim())) return 'phone';
  return 'sms';
}

/**
 * Demo fallback scanner — runs entirely on-device.
 *
 * Called when the backend is unavailable.  Checks input against
 * known Pakistani phishing patterns and falls back to a basic
 * keyword heuristic if no scenario matches.
 *
 * Every result has `isDemoFallback: true`.
 */
export function mockScanContent(content: string): Omit<ScanResult, 'id' | 'timestamp'> {
  const lower = content.toLowerCase();

  // ── Check deterministic demo scenarios first ──────────────
  for (const scenario of DEMO_SCENARIOS) {
    if (scenario.match.test(content)) {
      return {
        ...scenario.result,
        content,
        type:            scenario.result.type,
        isDemoFallback:  true,
      };
    }
  }

  // ── Generic keyword heuristic (no scenario matched) ───────
  const dangerSigns = [
    'verify', 'suspended', 'urgent', 'click here', 'login', 'secure-',
    '.xyz', '.tk', '.ml', 'bit.ly', 'tinyurl', 'account', 'update now',
  ];
  const suspiciousSigns = [
    'free', 'winner', 'prize', 'offer', 'limited time', 'confirm',
    'unusual', 'alert', 'notice', '?ref=', '&utm_',
  ];

  const dangerScore    = dangerSigns.filter(s => lower.includes(s)).length;
  const suspiciousScore = suspiciousSigns.filter(s => lower.includes(s)).length;
  const type           = inferDemoType(content);

  if (dangerScore >= 2) {
    return {
      content, type,
      risk:       'dangerous',
      confidence: Math.min(95, 70 + dangerScore * 5),
      details:    '[Demo] Multiple high-risk indicators detected in this content.',
      isDemoFallback: true,
    };
  }

  if (dangerScore === 1 || suspiciousScore >= 2) {
    return {
      content, type,
      risk:       'suspicious',
      confidence: Math.min(85, 55 + (dangerScore + suspiciousScore) * 5),
      details:    '[Demo] Some suspicious characteristics found. Exercise caution.',
      isDemoFallback: true,
    };
  }

  return {
    content, type,
    risk:       'safe',
    confidence: Math.max(88, 100 - suspiciousScore * 5),
    details:    '[Demo] No significant phishing indicators detected.',
    isDemoFallback: true,
  };
}
