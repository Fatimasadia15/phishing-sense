// ─────────────────────────────────────────────────────────────
//  Mock Data — local/static data for the frontend-only build
//  Replace data sources here when connecting a real backend.
// ─────────────────────────────────────────────────────────────

export interface ScanResult {
  id:         string;
  content:    string;
  type:       'url' | 'email' | 'sms' | 'phone';
  risk:       'safe' | 'suspicious' | 'dangerous';
  confidence: number;        // 0-100 risk score
  timestamp:  Date;
  details?:   string;
  /** Plain-language threat indicators (max 2 shown in UI per PRD). */
  indicators?: string[];
  /** Roman Urdu explanation from the backend (PRD bilingual requirement). */
  explanationUr?: string;
  /** Whether this result came from the demo fallback (offline) vs live analysis. */
  isDemoFallback?: boolean;
}

export interface ChatMessage {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
}

// ── Sense AI mock Q&A pairs ─────────────────────────────────
export interface QAPair {
  pattern: RegExp;
  response: string;
  responseUr?: string;
}

export const AI_QA_PAIRS: QAPair[] = [
  {
    // EN: phishing/scam/fraud · Roman Urdu: dhoka, farzi, nakli, jaali · Urdu: دھوکہ، فراڈ، جعلی
    pattern: /phish|fake|scam|fraud|dhok|farzi|nakli|jaali|jali|فشنگ|فراڈ|دھوکہ|جعلی|مکری/i,
    response:
      'Phishing is when someone pretends to be a trusted company to steal your personal information. Always check the sender\'s email address carefully — real companies use their official domain (like @bankname.com), never a random Gmail or strange domain.',
    responseUr:
      'فشنگ کا مطلب ہے کہ کوئی شخص کسی قابلِ بھروسہ کمپنی کا بہروپ بھر کر آپ کی ذاتی معلومات چرانے کی کوشش کرتا ہے۔ ہمیشہ بھیجنے والے کا ای میل ایڈریس غور سے چیک کریں — اصل کمپنیاں اپنے سرکاری ڈومین (جیسے @bankname.com) پر ای میل بھیجتی ہیں، کبھی بھی عجیب ڈومین سے نہیں۔',
  },
  {
    // EN: OTP/PIN/password · Roman Urdu: bata diya, de diya, share kar diya · Urdu: او ٹی پی، پاس ورڈ
    pattern: /otp|one.time|password|pass word|pin\b|کوڈ|پن|پاس/i,
    response:
      '⚠️ Never share your OTP, PIN, or password with anyone — not even someone claiming to be from your bank. Legitimate organizations will NEVER ask for these over the phone or SMS. If someone does, it\'s a scam. Hang up immediately.',
    responseUr:
      '⚠️ اپنا OTP، PIN یا پاس ورڈ کسی کے ساتھ شیئر نہ کریں — چاہے وہ بینک کا نمائندہ ہونے کا دعویٰ کرے۔ قانونی ادارے کبھی بھی فون یا ایس ایم ایس پر یہ معلومات نہیں مانگتے۔ اگر کوئی مانگے تو یہ scam ہے — فوراً کال منقطع کر دیں۔',
  },
  {
    // EN: link/URL/click · Roman Urdu: link, website · Urdu: لنک، ویب سائٹ
    pattern: /link|url|click|website|site\b|لنک|ویب|کلک/i,
    response:
      'Before clicking any link:\n1. Check the full URL carefully for misspellings (e.g., "paypa1.com")\n2. Hover over the link to see where it actually goes\n3. If it uses a URL shortener (bit.ly, tinyurl), be extra careful\n4. When in doubt, go directly to the official website by typing it yourself.',
    responseUr:
      'کسی بھی لنک پر کلک کرنے سے پہلے:\n1. پورا URL غور سے پڑھیں — ہجے غلط تو نہیں (جیسے "paypa1.com")\n2. لنک پر ماؤس لے جا کر دیکھیں کہ یہ اصل میں کہاں جاتا ہے\n3. اگر لنک چھوٹا کیا گیا ہو (bit.ly، tinyurl) تو خصوصی احتیاط کریں\n4. شک ہو تو خود سرکاری ویب سائٹ ٹائپ کر کے کھولیں۔',
  },
  {
    // EN: banks · Roman Urdu: bank names, account suspend · Urdu: بینک، اکاؤنٹ
    pattern: /bank|hbl|meezan|ubl|mcb|allied|jazzcash|easypaisa|account|بینک|اکاؤنٹ|حساب/i,
    response:
      'Banks will NEVER:\n• Ask for your PIN or full account number via SMS\n• Ask you to "verify" your account by clicking a link\n• Call you asking for your OTP\n\nIf you get such a call or message, hang up and call your bank directly using the number on the back of your card.',
    responseUr:
      'بینک کبھی نہیں کرتے:\n• ایس ایم ایس سے آپ کا PIN یا مکمل اکاؤنٹ نمبر مانگنا\n• لنک پر کلک کر کے اکاؤنٹ "وریفائی" کرنے کو کہنا\n• فون پر OTP مانگنا\n\nایسی کال یا پیغام ملے تو کال منقطع کریں اور کارڈ کے پچھے لکھے سرکاری نمبر پر خود بینک کو کال کریں۔',
  },
  {
    // EN: safe/legitimate · Roman Urdu: safe hai, asli hai, bharosa · Urdu: محفوظ، اصلی
    pattern: /safe|legitimate|real|genuine|trust|asli|sach|bharosa|qabil|محفوظ|اصل|سچ|بھروسہ/i,
    response:
      'To verify if something is legitimate:\n✓ Check the exact sender email address\n✓ Look for HTTPS in the URL (the padlock icon)\n✓ Search for the company\'s official website independently\n✓ Call the company directly using their official number\n✓ When in doubt, don\'t click — it\'s always safer to verify first.',
    responseUr:
      'چیز کی اصل جانچ کرنے کے لیے:\n✓ بھیجنے والے کا مکمل ای میل ایڈریس دیکھیں\n✓ URL میں HTTPS اور تالے (🔒) کی علامت دیکھیں\n✓ کمپنی کی سرکاری ویب سائٹ الگ سے تلاش کریں\n✓ سرکاری نمبر پر خود کمپنی کو کال کریں\n✓ شک ہو تو کلک نہ کریں — پہلے تصدیق کرنا ہمیشہ بہتر ہے۔',
  },
  {
    // EN: already shared · Roman Urdu: bata diya, de diya, bhej diya · Urdu: شیئر کر دیا، بتا دیا
    pattern: /shared|gave|told|disclosed|already|bata\s?di|de\s?di|bhej\s?di|dediya|batadiya|شیئر|بتا|دے دی|بھیج/i,
    response:
      "🚨 If you've already shared sensitive information:\n1. Change your password immediately on the real website\n2. Call your bank right away to freeze your account if financial info was shared\n3. Enable two-factor authentication on your accounts\n4. Monitor your bank statements for unusual transactions\n5. Report the incident to your local cybercrime authority\n\nDon't panic — act quickly and you can minimize the damage.",
    responseUr:
      '🚨 اگر آپ نے پہلے ہی حساس معلومات شیئر کر دی ہیں تو:\n1. اصل ویب سائٹ پر فوراً اپنا پاس ورڈ بدلیں\n2. مالی معلومات شیئر ہوئی ہوں تو فوراً بینک کو کال کر کے اکاؤنٹ فریز کروائیں\n3. اپنے اکاؤنٹس پر ٹو فیکٹر ایوتھنٹیکیشن آن کریں\n4. بینک اسٹیٹمنٹ پر غیر معمولی لین دین کی نظر رکھیں\n5. واقعے کی رپورٹ مقامی سائبر کرائم اتھارٹی کو کریں\n\nگھبرائیں نہیں — فوری اقدام سے نقصان کم ہو سکتا ہے۔',
  },
];

export const AI_DEFAULT_RESPONSE =
  "That's a great question about online safety. As a general rule: if something feels suspicious or too good to be true, it probably is. Trust your instincts and always verify through official channels before taking any action. Is there something specific you'd like to know more about?";

export const AI_DEFAULT_RESPONSE_UR =
  'آن لائن سلامتی کے بارے میں اچھا سوال ہے۔ عمومی اصول یہ ہے: اگر کوئی چیز مشکوک لگے یا اتنی اچھی لگے کہ یقین نہ ہو، تو عام طور پر وہ جھوٹی ہوتی ہے۔ اپنے اندازے پر بھروسہ کریں اور کوئی بھی اقدام کرنے سے پہلے سرکاری ذرائع سے تصدیق کریں۔ کیا آپ کچھ مخصوص جاننا چاہتے ہیں؟';

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
      indicators: [
        'Pretends to be your bank and creates fake urgency',
        'Asks you to "verify" your account through a link',
      ],
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
      indicators: [
        'Claims free government money you never applied for',
        'Asks you to click a link to "receive" the payment',
      ],
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
      indicators: [
        'Delivery notice with a shortened or strange link',
        'Creates pressure to "confirm" a package you may not expect',
      ],
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
      indicators: [
        'Asks you to share an OTP or verification code',
        'No real company ever asks for codes by message',
      ],
    },
  },
  {
    // Scenario 5: Legitimate transactional message
    match: /\b(transaction|spent|received|debited|credited|balance)\b.*\b(pkr|rs\.?|rupees|account)\b/i,
    result: {
      type:       'sms',
      risk:       'safe',
      confidence: 90,
      details:    '[Offline limited analysis] No major warning signs detected in this limited offline check. This is not a verified safe result — confirm the sender through official channels.',
      indicators: [
        'No major warning signs were found by the limited offline checks',
        'Verify the sender independently before sharing information',
      ],
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
      indicators: [
        'Contains several known scam phrases or fake links',
        'Tries to push you to act quickly without thinking',
      ],
      isDemoFallback: true,
    };
  }

  if (dangerScore === 1 || suspiciousScore >= 2) {
    return {
      content, type,
      risk:       'suspicious',
      confidence: Math.min(85, 55 + (dangerScore + suspiciousScore) * 5),
      details:    '[Demo] Some suspicious characteristics found. Exercise caution.',
      indicators: [
        'Uses offer or urgency language that feels pushy',
        'Cannot be confirmed as coming from a real source',
      ],
      isDemoFallback: true,
    };
  }

  return {
    content, type,
    risk:       'safe',
    confidence: Math.max(88, 100 - suspiciousScore * 5),
    details:    '[Offline limited analysis] No major warning signs detected in this limited offline check. This is not a verified safe result.',
    indicators: [
      'No major warning signs were found by the limited offline checks',
      'Verify the sender independently before sharing information',
    ],
    isDemoFallback: true,
  };
}
