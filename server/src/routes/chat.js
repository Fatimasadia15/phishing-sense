// ─────────────────────────────────────────────────────────────
//  POST /api/chat — Sense AI Chat Route Handler
// ─────────────────────────────────────────────────────────────

const { callLlmChat } = require('../engine/llm');
const { redactSensitive } = require('../engine/redact');

/**
 * Fallback intent-based response generator when LLM is offline.
 * Provides targeted, intelligent answers matching user keywords.
 */
function getSmartFallbackChatResponse(message, language = 'en') {
  const isUrduScript = /[\u0600-\u06FF\u0750-\u077F]/.test(message);
  const useUrdu = language === 'ur' || isUrduScript;
  const lower = message.toLowerCase().trim();

  // Intent 0a: Reset / Change / Forgot Password (SPECIFIC)
  if (
    /\b(reset|forgot|change|update|set|new)\b.*\bpassword\b/i.test(lower) ||
    /\bpassword\b.*\b(reset|forgot|change|update|set|new)\b/i.test(lower) ||
    /\b(pass\s?reset|forgot\s?pass)\b/i.test(lower) ||
    /پاس\s?ورڈ|ری\s?سیٹ|پاسورڈ/.test(lower)
  ) {
    return useUrdu
      ? "🔐 **پاس ورڈ مینجمنٹ (Password Management):**\n• **پاس ورڈ بھول گئے؟** لاگ ان سکرین پر *Forgot Password?* پر ٹیپ کریں۔ آپ کو ای میل میں لنک ملے گا جو فوراً **New Password & Confirm Password** سکرین پر لے جائے گا۔\n• **پاس ورڈ تبدیل کریں:** ایپ کی **Settings** سکرین پر جائیں اور **Change Account Password** سیکشن میں نیا پاس ورڈ سیٹ کریں۔"
      : "🔐 **Password Management in Phishing Sense:**\n• **Forgot Password:** Tap *Forgot Password?* on the login screen. The reset link in your email routes you directly to the **New Password & Confirm Password** screen.\n• **Change Password Anytime:** Open **Settings** from the bottom menu → fill out the **Change Account Password** section with your new password.";
  }

  // Intent 0b: Panic Mode emergency help (SPECIFIC)
  if (
    /\b(panic\s?mode|scammed\s?now|emergency|help\s?me|got\s?scammed|scam\s?help|fraud\s?help)\b/i.test(lower) ||
    /پینک\s?موڈ|ایمرجنسی|ہیلپ/.test(lower)
  ) {
    return useUrdu
      ? "🚨 **پینک موڈ (Panic Mode):**\nاگر آپ کے ساتھ اس وقت دھوکہ ہو رہا ہے یا پیسے بھیج دیے ہیں:\n• ہوم سکرین پر سرخ **Panic Mode** بٹن پر ٹیپ کریں۔\n• گائیڈ پر عمل کرتے ہوئے فوراً بینک/ایزی پیسہ اکاؤنٹس فریز کریں اور سائبر کرائم ہیلپ لائن (**1991**) پر رپورٹ کریں۔"
      : "🚨 **Panic Mode (Scam Emergency):**\nIf you suspect you are being scammed right now:\n• Tap the red **Panic Mode** button on the Home screen.\n• It walks you through immediate emergency actions: freezing bank accounts, changing passwords, and reporting to FIA Cybercrime (1991).";
  }

  // Intent 0c: Scanner usage & phone lookup (SPECIFIC)
  if (
    /\b(how|where|way)\b.*\b(scan|check)\b/i.test(lower) ||
    /\b(scan|check)\b.*\b(how|number|link|url|phone|email)\b/i.test(lower) ||
    /\b(555-?01|toll\s?free|robocall)\b/i.test(lower) ||
    /اسکین|چیک/.test(lower)
  ) {
    return useUrdu
      ? "🛡️ **فشنگ سینس اسکینر استعمال کرنے کا طریقہ:**\n1. نیچے مینو سے **Scan** پر ٹیپ کریں۔\n2. مطلوبہ ٹیب چنیں (**Link**, **Email**, **SMS**, یا **Phone**).\n3. مشکوک مواد یا فون نمبر پیسٹ کریں۔\n4. **Check for Risk** پر ٹیپ کریں — سینس AI رسک اسکور (0-100%) اور 555-01XX اسپوفڈ یا ٹول فری لائنز کے نتائج دکھائے گا۔"
      : "🛡️ **How to Scan in Phishing Sense:**\n1. Tap **Scan** from the bottom menu.\n2. Select the matching tab (**Link**, **Email**, **SMS**, or **Phone**).\n3. Paste your suspicious text, URL, or phone number.\n4. Tap **Check for Risk** — Sense AI will calculate the risk score (0-100%) and detect reserved 555-01XX spoofing or toll-free numbers.";
  }

  // Intent 0d: Privacy & Data Protection (SPECIFIC)
  if (
    /\b(privacy|my\s?data|redact|safe\s?data|is\s?it\s?private|zero\s?trust|data\s?safe)\b/i.test(lower) ||
    /پرائیویسی|ڈیٹا/.test(lower)
  ) {
    return useUrdu
      ? "🔒 **زیرو ٹرسٹ پرائیویسی (Zero-Trust Privacy):**\nPhishing Sense آپ کا پاس ورڈ، OTP، PIN یا نجی معلومات کبھی آن لائن نہیں بھیجتا۔ ہمارا آن ڈیوائس ریڈیکٹر آپ کے ڈیوائس پر ہی حساس معلومات (`******`) ماسک کرتا ہے۔ آپ **Settings** → **Clear Scan History** سے ہسٹری بھی صاف کر سکتے ہیں۔"
      : "🔒 **Zero-Trust Privacy in Phishing Sense:**\nPhishing Sense never sends passwords, PINs, or OTPs over the network. Our on-device redaction engine automatically masks sensitive data (`******`) before risk analysis. You can also erase scan history anytime in **Settings**.";
  }

  // Intent 0e: App Settings & Customization (SPECIFIC)
  if (
    /\b(settings|change\s?language|language|urdu|english|app\s?lock|dark\s?mode|preferences)\b/i.test(lower) ||
    /سیٹنگز|زبان/.test(lower)
  ) {
    return useUrdu
      ? "⚙️ **ایپ سیٹنگز (App Settings):**\n• **زبان تبدیل کریں:** اوپر والے گلوب (🌐) آئیکن سے اردو یا انگریزی منتخب کریں۔\n• **سیکیورٹی:** **Settings** میں جا کر پاس ورڈ اپ ڈیٹ کریں یا App Lock فعال کریں۔\n• **ہسٹری کلیئر:** **Settings** میں جا کر 'Clear Scan History' دبائیں۔"
      : "⚙️ **App Settings & Preferences:**\n• **Change Language:** Tap the globe icon in the top bar to switch between English & Urdu.\n• **Security & Password:** Go to **Settings** to update your account password or toggle App Lock.\n• **Clear History:** Erase all stored scan records in **Settings** → **Clear Scan History**.";
  }

  // Intent 0: Phishing Sense App Overview & "What does this app do?" (GENERIC)
  if (
    /\b(phishing\s?sense|this\s?app|app\s?do|about\s?app|how\s?this\s?works?|how\s?app\s?works?|app\s?features?|who\s?are\s?you|what\s?is\s?this)\b/i.test(lower) ||
    /ایپ/.test(lower)
  ) {
    return useUrdu
      ? "🛡️ Phishing Sense آپ کا سمارٹ AI سیکیورٹی اسسٹنٹ ہے۔ یہ آپ کو آن لائن دھوکے سے بچاتا ہے:\n1. **اسکینر:** Web Links، Emails، SMS اور Phone Numbers کا سیکیورٹی رسک اسکور۔\n2. **کالر چیک:** مشکوک کالرز، 555-01XX اسپوفڈ نمبرز اور ٹول فری لائنز کی جانچ۔\n3. **زیرو ٹرسٹ پرائیویسی:** آپ کا OTP، PIN اور حساس ڈیٹا ڈیوائس پر ہی ماسک ہوتا ہے۔\n4. **پاس ورڈ مینجمنٹ:** Forgot Password اور Settings سے پاس ورڈ تبدیلی کی سہولت۔\n5. **پینک موڈ:** اگر اسکیم ہو جائے تو فوری ایمرجنسی ہیلپ لائن (1991) اور گائیڈ لائنس۔"
      : "🛡️ Phishing Sense is your intelligent AI-powered anti-phishing & scam protection assistant:\n\n1. **Multi-Tab Scanner:** Analyzes Web Links, Emails, SMS text, and Phone numbers.\n2. **Real-Time Phone Lookup:** Identifies robocall spoofing, reserved 555-01XX lines, and international toll-free numbers.\n3. **Password Management:** Forgot password workflow with reset link & inline password changes in Settings.\n4. **Zero-Trust Privacy:** Automatically redacts OTPs, PINs, and CNICs on your device before cloud analysis.\n5. **Panic Mode:** Emergency step-by-step guidance if you're being scammed right now.";
  }

  // Intent 1: OTP / PIN / Password compromised or asked
  if (/\b(otp|pin|code|verification)\b/i.test(lower)) {
    return useUrdu
      ? "⚠️ اپنا OTP، PIN یا پاس ورڈ کبھی کسی کے ساتھ شیئر نہ کریں۔ اگر آپ نے غلطی سے بھیج دیا ہے:\n1. فوراً اصل ویب سائٹ/ایپ پر اپنا پاس ورڈ تبدیل کریں۔\n2. بینک کو کال کر کے اپنا کارڈ اور اکاؤنٹ فریز کرائیں۔\n3. بینک کبھی فون یا ایس ایم ایس پر OTP نہیں مانگتے۔"
      : "⚠️ NEVER share your OTP, PIN, or password with anyone — not even bank staff.\n\nIf you accidentally shared it:\n1. Change your account password immediately on the official app/website.\n2. Call your bank hotline right away to freeze your account.\n3. Enable 2-Factor Authentication (2FA) on all active accounts.";
  }

  // Intent 2: Bank scams (HBL, Meezan, Easypaisa, JazzCash, etc.)
  if (/\b(bank|hbl|meezan|ubl|mcb|easypaisa|jazzcash|account|blocked|suspended)\b/i.test(lower)) {
    return useUrdu
      ? "بینک سے متعلق اہم رہنمائی:\n• بینک کبھی ایس ایم ایس یا واٹس ایپ پر اکاؤنٹ ان بلاک کرنے کے لیے لنک نہیں بھیجتے۔\n• کبھی کسی غیر تصدیق شدہ لنک پر اپنے لاگ ان کریڈنشیلز درج نہ کریں۔\n• شک کی صورت میں اپنے بینک کارڈ کے پیچھے درج آفیشل ہیلپ لائن پر کال کریں۔"
      : "Key Bank Safety Guidelines:\n• Banks in Pakistan never send SMS links to 'unblock' or 'verify' accounts.\n• Never enter your login details on unfamiliar websites.\n• If you get a suspicious SMS/call, hang up and call your official bank helpline (printed on your debit card).";
  }

  // Intent 3: Suspicious links or websites
  if (/\b(link|url|website|click|http|bit\.ly|tinyurl)\b/i.test(lower)) {
    return useUrdu
      ? "لنک کی تصدیق کا طریقہ:\n1. یو آر ایل کا ہجہ غور سے چیک کریں (مثلاً google.com کی جگہ g00gle.xyz)\n2. شارٹ کیے گئے لنکس (bit.ly, tinyurl) سے احتیاط کریں۔\n3. آپ اس لنک کو Phishing Sense کے 'Scan' ٹیب میں پیسٹ کر کے فوراً رسک چیک کر سکتے ہیں۔"
      : "How to check if a link is safe:\n1. Inspect the URL domain closely for spelling tricks (e.g. 'paypal-security.xyz' instead of 'paypal.com').\n2. Be cautious with shorteners (bit.ly, tinyurl).\n3. Paste the link into the Phishing Sense 'Scan' tab to analyze its risk score instantly!";
  }

  // Intent 4: BISP / Ehsaas / Prize / Lottery scams
  if (/\b(bisp|benazir|ehsaas|8171|prize|lottery|inam|money|free)\b/i.test(lower)) {
    return useUrdu
      ? "🚨 بی آئی ایس پی (BISP) اور قرعہ اندازی اسکیم خبردار:\n• حکومت یا بی آئی ایس پی کبھی غیر سرکاری واٹس ایپ/ایس ایم ایس پر پیسے ملنے کے میسج نہیں بھیجتی۔\n• 8171 کی تمام تصدیق صرف 8171.bisp.gov.pk پر ہوتی ہے۔\n• پیسے حاصل کرنے کے لیے کوئی 'فیس' یا 'پاس ورڈ' نہ دیں۔"
      : "🚨 BISP & Prize Scam Warning:\n• BISP/Ehsaas never notifies winners or sends money via WhatsApp or random mobile numbers.\n• Check official eligibility only at 8171.bisp.gov.pk.\n• Never pay any 'processing fee' or 'tax' to claim a prize.";
  }

  // Default intelligent response
  return useUrdu
    ? "آپ کا آن لائن تحفظ اور Phishing Sense ایپ کے حوالے سے سوال اہم ہے۔ اگر آپ کے پاس کوئی مشکوک میسج، لنک یا فون نمبر ہے تو اسے 'Scan' سکرین میں چیک کریں۔ کسی بھی پریشانی کی صورت میں اپنی سیکیورٹی معلومات محفوظ رکھیں۔"
    : "That's a great question about Phishing Sense and online safety. You can paste any suspicious text, link, email, or phone number into the 'Scan' tab for instant analysis. Legitimate services will never ask you to share your passwords or OTPs.";
}

/**
 * POST /api/chat
 * Body: { "message": "string", "language": "en" | "ur" }
 */
async function handleChat(req, res) {
  try {
    const { message, language } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const cleanMessage = redactSensitive(message.trim());
    const llmAnswer = await callLlmChat(cleanMessage, language);

    if (llmAnswer) {
      return res.json({ reply: llmAnswer, source: 'ai' });
    }

    // Smart heuristic fallback if LLM is off
    const fallbackAnswer = getSmartFallbackChatResponse(cleanMessage, language);
    return res.json({ reply: fallbackAnswer, source: 'fallback' });
  } catch (err) {
    console.error('[chat] Error handling chat:', err.message);
    res.status(500).json({ error: 'Chat processing failed' });
  }
}

module.exports = { handleChat, getSmartFallbackChatResponse };
