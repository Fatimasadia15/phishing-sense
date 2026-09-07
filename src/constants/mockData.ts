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
    // EN: Reset Password in App (SPECIFIC - Evaluated before generic "app")
    pattern: /reset\s?password|forgot\s?password|change\s?password|update\s?password|pass\s?reset|new\s?password/i,
    response:
      '🔐 **Password Management in Phishing Sense:**\n• **Forgot Password:** Tap *Forgot Password?* on the login screen. The reset link in your email routes you directly to the **New Password & Confirm Password** screen.\n• **Change Password Anytime:** Go to **Settings** → **Change Account Password** to set a new password for your account.',
    responseUr:
      '🔐 **Password Management (Phishing Sense):**\n• **Password bhool gaye?** Login screen par *Forgot Password?* par tap karein. Naya password set karne ke liye email link mil jayega.\n• **Password tabdeel karna:** Settings screen par ja kar *Change Account Password* se kisi bhi waqt naya password set karein.',
  },
  {
    // EN: Panic Mode emergency help (SPECIFIC)
    pattern: /panic\s?mode|scammed\s?now|emergency|help\s?me|got\s?scammed|scam\s?help/i,
    response:
      '🚨 **Panic Mode (Scam Emergency):**\nIf you suspect you are being scammed right now:\n• Tap the red **Panic Mode** button on the Home screen.\n• It walks you through immediate emergency actions: freezing bank accounts, changing passwords, and reporting to FIA Cybercrime (1991).',
    responseUr:
      '🚨 **Panic Mode (Emergency Madad):**\nAgar aapke sath fraud ho raha hai:\n• Home screen par red **Panic Mode** button dabayein.\n• Yeh aapko foran bank accounts freeze karne, password badalne aur FIA Cybercrime (1991) par report karne ka tareeqa batayega.',
  },
  {
    // EN: Scanner usage & phone lookup (SPECIFIC)
    pattern: /how\s?to\s?scan|how\s?to\s?check|how\s?do\s?i\s?scan|how\s?use\s?scanner|check\s?number|scan\s?link|555-?01|toll\s?free/i,
    response:
      '🛡️ **How to Scan in Phishing Sense:**\n1. Tap **Scan** from the bottom menu.\n2. Select the matching tab (**Link**, **Email**, **SMS**, or **Phone**).\n3. Paste your suspicious text or link.\n4. Tap **Check for Risk** — Sense AI will calculate the risk score (0-100%) and explain threat indicators or spoofing reserved numbers.',
    responseUr:
      '🛡️ **Phishing Sense mein Scan karne ka tareeqa:**\n1. Neeche menu se **Scan** par tap karein.\n2. Sahi tab chunein (**Link**, **Email**, **SMS**, ya **Phone**).\n3. Mashkook content ya number paste karein.\n4. **Check for Risk** dabayein — Sense AI foran risk score aur threat indicators dikhayega.',
  },
  {
    // EN: Privacy & Data Protection in App (SPECIFIC)
    pattern: /privacy|my\s?data|redact|safe\s?data|is\s?it\s?private|zero\s?trust/i,
    response:
      '🔒 **Zero-Trust Privacy in Phishing Sense:**\nPhishing Sense never sends passwords, PINs, or OTPs over the network. Our on-device redaction engine automatically masks sensitive data (`******`) before any risk analysis takes place.',
    responseUr:
      '🔒 **Zero-Trust Privacy:** Phishing Sense aapka password, OTP ya niji data kabhi internet par nahi bhejta. Humara on-device redactor aapke mobile par hi sensitive data (`******`) mask kar deta hai.',
  },
  {
    // EN: Phishing Sense App Overview (GENERIC)
    pattern: /phishing\s?sense|this\s?app|app\s?do|about\s?app|how\s?this\s?works?|how\s?app\s?works?|app\s?features?|who\s?are\s?you|what\s?is\s?this/i,
    response:
      '🛡️ Phishing Sense is your intelligent AI-powered anti-phishing & scam protection assistant:\n\n1. **Multi-Tab Scanner:** Analyzes Web Links, Emails, SMS text, and Phone numbers.\n2. **Real-Time Phone Lookup:** Identifies robocall spoofing, reserved 555-01XX lines, and international toll-free numbers.\n3. **Password Management:** Forgot password link & inline password update in Settings.\n4. **Zero-Trust Privacy:** Automatically redacts OTPs, PINs, and CNICs on your device before cloud analysis.\n5. **Panic Mode:** Emergency step-by-step guidance if you\'re being scammed right now.',
    responseUr:
      '🛡️ Phishing Sense aapka smart AI security assistant hai:\n1. **Scanner:** Web Links, Emails, SMS aur Phone Numbers ka risk score check karta hai.\n2. **Caller Check:** Mashkook callers aur spoofed numbers ki pehchan karta hai.\n3. **Password Management:** Reset aur password change ki sahulat.\n4. **Zero-Trust Privacy:** OTP aur PIN device par hi mask hote hain.\n5. **Panic Mode:** Scam hone par emergency guidance aur FIA 1991 helpline.',
  },
  {
    // EN: phishing/scam/fraud · Roman Urdu: dhoka, farzi, nakli, jaali · Urdu: دھوکہ، فراڈ، جعلی
    pattern: /phish|fake|scam|fraud|dhok|farzi|nakli|jaali|jali|فشنگ|فراڈ|دھوکہ|جعلی|مکری/i,
    response:
      'Phishing is when someone pretends to be a trusted company to steal your personal information. Always check the sender\'s email address carefully — real companies use their official domain (like @bankname.com), never a random Gmail or strange domain.',
    responseUr:
      'Phishing ka matlab hai ke koi dhokaybaaz kisi mashhoor company ka naam istemal kar ke aapki personal details churanay ki koshish karta hai. Hamesha sender ka email address check karein — genuine companies official domain (@bankname.com) istemal karti hain, koi aam Gmail ya ajeeb link nahi.',
  },
  {
    // EN: OTP/PIN/password · Roman Urdu: bata diya, de diya, share kar diya · Urdu: او ٹی پی، پاس ورڈ
    pattern: /otp|one.time|password|pass word|pin\b|کوڈ|پن|پاس/i,
    response:
      '⚠️ Never share your OTP, PIN, or password with anyone — not even someone claiming to be from your bank. Legitimate organizations will NEVER ask for these over the phone or SMS. If someone does, it\'s a scam. Hang up immediately.',
    responseUr:
      '⚠️ Apna OTP, PIN ya password kisi ke sath share na karein — chahe woh bank ka numainda hone ka daawa karein. Asli bank ya companies kabhi bhi phone ya SMS par OTP nahi mangtein. Agar koi mange to yeh 100% scam hai — foran call kaat dein.',
  },
  {
    // EN: link/URL/click · Roman Urdu: link, website · Urdu: لنک، ویب سائٹ
    pattern: /link|url|click|website|site\b|لنک|ویب|کلک/i,
    response:
      'Before clicking any link:\n1. Check the full URL carefully for misspellings (e.g., "paypa1.com")\n2. Hover over the link to see where it actually goes\n3. If it uses a URL shortener (bit.ly, tinyurl), be extra careful\n4. When in doubt, go directly to the official website by typing it yourself.',
    responseUr:
      'Kisi bhi link par click karne se pehle:\n1. Poora URL ghaur se check karein ke spelling theek hai ya nahi (jaise "paypa1.com").\n2. Short links (bit.ly, tinyurl) se khaas ehtiyat karein.\n3. Shak ho to link ko Phishing Sense ke **Scan** tab mein check karein.',
  },
  {
    // EN: banks · Roman Urdu: bank names, account suspend · Urdu: بینک، اکاؤنٹ
    pattern: /bank|hbl|meezan|ubl|mcb|allied|jazzcash|easypaisa|account|بینک|اکاؤنٹ|حساب/i,
    response:
      'Banks will NEVER:\n• Ask for your PIN or full account number via SMS\n• Ask you to "verify" your account by clicking a link\n• Call you asking for your OTP\n\nIf you get such a call or message, hang up and call your bank directly using the number on the back of your card.',
    responseUr:
      'Banks kabhi bhi:\n• SMS par aapka PIN ya poora account number nahi mangte\n• Link par click kar ke account "verify" karne ko nahi kehte\n• Phone par OTP nahi mangte\n\nAisi call ya message aaye to foran kaat dein aur card ke peeche diye gaye official number par bank se rabta karein.',
  },
  {
    // EN: safe/legitimate · Roman Urdu: safe hai, asli hai, bharosa · Urdu: محفوظ، اصلی
    pattern: /safe|legitimate|real|genuine|trust|asli|sach|bharosa|qabil|محفوظ|اصل|سچ|بھروسہ/i,
    response:
      'To verify if something is legitimate:\n✓ Check the exact sender email address\n✓ Look for HTTPS in the URL (the padlock icon)\n✓ Search for the company\'s official website independently\n✓ Call the company directly using their official number\n✓ When in doubt, don\'t click — it\'s always safer to verify first.',
    responseUr:
      'Cheez ki asaliyat check karne ke liye:\n✓ Sender ka mukammal email address check karein\n✓ URL mein padlock icon aur HTTPS dekhein\n✓ Company ki official website alag se search karein\n✓ Shak ho to click na karein — pehle tasdeeq karna hamesha behtar hai.',
  },
  {
    // EN: already shared · Roman Urdu: bata diya, de diya, bhej diya · Urdu: شیئر کر دیا، بتا دیا
    pattern: /shared|gave|told|disclosed|already|bata\s?di|de\s?di|bhej\s?di|dediya|batadiya|شیئر|بتا|دے دی|بھیج/i,
    response:
      "🚨 If you've already shared sensitive information:\n1. Change your password immediately on the real website\n2. Call your bank right away to freeze your account if financial info was shared\n3. Enable two-factor authentication on your accounts\n4. Monitor your bank statements for unusual transactions\n5. Report the incident to your local cybercrime authority\n\nDon't panic — act quickly and you can minimize the damage.",
    responseUr:
      '🚨 Agar aapne pehle hi sensitive information share kar di hai:\n1. Asli website par foran apna password change karein\n2. Bank helpline par call kar ke foran card aur account freeze karwayein\n3. Apne accounts par 2-Factor Authentication on karein\n4. Bank statement par ghaur karein aur FIA Cybercrime (1991) par report karein.\n\nPareshan na hon — foran action lene se nuqsan se bacha ja sakta hai.',
  },
];

export const AI_DEFAULT_RESPONSE =
  "That's a great question about online safety. As a general rule: if something feels suspicious or too good to be true, it probably is. Trust your instincts and always verify through official channels before taking any action. Is there something specific you'd like to know more about?";

export const AI_DEFAULT_RESPONSE_UR =
  'Online safety ke hawale se yeh ahem sawal hai. Aam usool yeh hai: agar koi message ya offer mashkook lage to hamesha official helpline se tasdeeq karein. Apna OTP ya password kabhi kisi ko na dein.';

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
  const type = inferDemoType(content);

  // ── Check phone numbers (555-01XX reserved lines, toll-free, known scams) ──────
  if (type === 'phone' || /^\+?[\d\s\-()]{7,20}$/.test(content.trim())) {
    const rawClean = content.replace(/\D/g, '');
    const is555_01 = /55501\d{2}$/.test(rawClean) || /555-?01\d{2}/.test(content);
    const isTollFree = /^1?(800|888|877|866|855|844|833)/.test(rawClean);
    const KNOWN_SCAM_NUMBERS = ['03001234567', '03119876543', '18005550199', '8005550199', '18005550100', '8005550100'];

    if (is555_01 || KNOWN_SCAM_NUMBERS.includes(rawClean)) {
      return {
        content,
        type: 'phone',
        risk: 'dangerous',
        confidence: 95,
        details: '[Offline Check] Uses an official reserved 555-01XX line in North America frequently flagged for automated robocalls, bank imposter phishing, and urgent OTP scams.',
        indicators: [
          'Reserved 555-01XX test/spoofing line commonly used in robocall scams',
          'High risk number reported for bank impersonation and OTP theft',
        ],
        isDemoFallback: true,
      };
    }

    if (isTollFree) {
      return {
        content,
        type: 'phone',
        risk: 'suspicious',
        confidence: 65,
        details: '[Offline Check] Toll-free international number detected (+1 800-series). Frequently mimicked by automated robocalls and impersonation scams.',
        indicators: [
          'Toll-free number format often mimicked by automated robocalls',
          'Verify official organization details before answering or returning calls',
        ],
        isDemoFallback: true,
      };
    }
  }

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
