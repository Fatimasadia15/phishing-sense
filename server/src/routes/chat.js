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
    /پاس\s?ورڈ|ری\s?سیٹ|پاسورڈ|password/i.test(lower)
  ) {
    return useUrdu
      ? "🔐 **Password Management (Phishing Sense):**\n• **Password bhool gaye?** Login screen par *Forgot Password?* par tap karein. Aapko email par link milega jahan se direct naya password set kar sakte hain.\n• **Password tabdeel karna:** App ki **Settings** screen par jayein aur **Change Account Password** section se naya password save karein."
      : "🔐 **Password Management in Phishing Sense:**\n• **Forgot Password:** Tap *Forgot Password?* on the login screen. The reset link in your email routes you directly to the **New Password & Confirm Password** screen.\n• **Change Password Anytime:** Open **Settings** from the bottom menu → fill out the **Change Account Password** section with your new password.";
  }

  // Intent 0b: Panic Mode emergency help (SPECIFIC)
  if (
    /\b(panic\s?mode|scammed\s?now|emergency|help\s?me|got\s?scammed|scam\s?help|fraud\s?help)\b/i.test(lower) ||
    /پینک\s?موڈ|ایمرجنسی|ہیلپ|madad|scam\s?ho\s?gaya/i.test(lower)
  ) {
    return useUrdu
      ? "🚨 **Panic Mode (Emergency Madad):**\nAgar aapke sath is waqt scam ho raha hai ya paise bhej diye hain:\n• Home screen par red **Panic Mode** button par tap karein.\n• Guide par amal karte hue foran bank/Easypaisa/JazzCash account freeze karein aur FIA Cybercrime helpline (**1991**) par call karein."
      : "🚨 **Panic Mode (Scam Emergency):**\nIf you suspect you are being scammed right now:\n• Tap the red **Panic Mode** button on the Home screen.\n• It walks you through immediate emergency actions: freezing bank accounts, changing passwords, and reporting to FIA Cybercrime (1991).";
  }

  // Intent 0c: Scanner usage & phone lookup (SPECIFIC)
  if (
    /\b(how|where|way)\b.*\b(scan|check)\b/i.test(lower) ||
    /\b(scan|check)\b.*\b(how|number|link|url|phone|email)\b/i.test(lower) ||
    /\b(555-?01|toll\s?free|robocall)\b/i.test(lower) ||
    /اسکین|چیک|scan\s?karna|check\s?karna/i.test(lower)
  ) {
    return useUrdu
      ? "🛡️ **Phishing Sense Scanner istemal karne ka tareeqa:**\n1. Neeche navigation bar se **Scan** par tap karein.\n2. Sahi tab select karein (**Link**, **Email**, **SMS**, ya **Phone**).\n3. Mashkook message, link ya number paste karein.\n4. **Check for Risk** dabayein — Sense AI foran 0-100% risk score aur threat indicators dikhayega."
      : "🛡️ **How to Scan in Phishing Sense:**\n1. Tap **Scan** from the bottom menu.\n2. Select the matching tab (**Link**, **Email**, **SMS**, or **Phone**).\n3. Paste your suspicious text, URL, or phone number.\n4. Tap **Check for Risk** — Sense AI will calculate the risk score (0-100%) and detect reserved 555-01XX spoofing or toll-free numbers.";
  }

  // Intent 0d: Privacy & Data Protection (SPECIFIC)
  if (
    /\b(privacy|my\s?data|redact|safe\s?data|is\s?it\s?private|zero\s?trust|data\s?safe)\b/i.test(lower) ||
    /پرائیویسی|ڈیٹا|mehfooz/i.test(lower)
  ) {
    return useUrdu
      ? "🔒 **Zero-Trust Privacy (Aapka Data Mehfooz Hai):**\nPhishing Sense aapka password, OTP, PIN ya CNIC kabhi online nahi bhejta. Humara on-device redaction engine aapke mobile par hi sensitive data ko mask (`******`) kar deta hai. Aap **Settings** se scan history bhi delete kar sakte hain."
      : "🔒 **Zero-Trust Privacy in Phishing Sense:**\nPhishing Sense never sends passwords, PINs, or OTPs over the network. Our on-device redaction engine automatically masks sensitive data (`******`) before risk analysis. You can also erase scan history anytime in **Settings**.";
  }

  // Intent 0e: App Settings & Customization (SPECIFIC)
  if (
    /\b(settings|change\s?language|language|urdu|english|app\s?lock|dark\s?mode|preferences)\b/i.test(lower) ||
    /سیٹنگز|زبان|settings\s?kahan/i.test(lower)
  ) {
    return useUrdu
      ? "⚙️ **App Settings aur Preferences:**\n• **Language tabdeel karein:** Top bar mein globe (🌐) icon se English ya Roman Urdu select karein.\n• **Security:** **Settings** mein ja kar account password update karein ya App Lock on karein.\n• **History clear karein:** **Settings** → **Clear Scan History** se purana data mita dein."
      : "⚙️ **App Settings & Preferences:**\n• **Change Language:** Tap the globe icon in the top bar to switch between English & Urdu.\n• **Security & Password:** Go to **Settings** to update your account password or toggle App Lock.\n• **Clear History:** Erase all stored scan records in **Settings** → **Clear Scan History**.";
  }

  // Intent 0: Phishing Sense App Overview & "What does this app do?" (GENERIC)
  if (
    /\b(phishing\s?sense|this\s?app|app\s?do|about\s?app|how\s?this\s?works?|how\s?app\s?works?|app\s?features?|who\s?are\s?you|what\s?is\s?this)\b/i.test(lower) ||
    /ایپ|kya\s?karti\s?hai|app\s?kya\s?hai/i.test(lower)
  ) {
    return useUrdu
      ? "🛡️ Phishing Sense aapka smart AI scam protection assistant hai. Yeh aapko online dhokay aur fraud se bachata hai:\n1. **Multi-Tab Scanner:** Web links, emails, SMS aur phone numbers ka security risk score check karta hai.\n2. **Caller Check:** Mashkook callers, robocalls aur spoofed numbers ki pehchan karta hai.\n3. **Zero-Trust Privacy:** Aapka OTP, PIN aur sensitive data device par hi mask hota hai.\n4. **Password Management:** Forgot password aur Settings se password tabdeel karne ki sahulat.\n5. **Panic Mode:** Scam hone par foran emergency guidance aur FIA 1991 helpline."
      : "🛡️ Phishing Sense is your intelligent AI-powered anti-phishing & scam protection assistant:\n\n1. **Multi-Tab Scanner:** Analyzes Web Links, Emails, SMS text, and Phone numbers.\n2. **Real-Time Phone Lookup:** Identifies robocall spoofing, reserved 555-01XX lines, and international toll-free numbers.\n3. **Password Management:** Forgot password workflow with reset link & inline password changes in Settings.\n4. **Zero-Trust Privacy:** Automatically redacts OTPs, PINs, and CNICs on your device before cloud analysis.\n5. **Panic Mode:** Emergency step-by-step guidance if you're being scammed right now.";
  }

  // Intent 1: OTP / PIN / Password compromised or asked
  if (/\b(otp|pin|code|verification)\b/i.test(lower)) {
    return useUrdu
      ? "⚠️ Apna OTP, PIN ya password KABHI kisi ke sath share na karein — bank staff ke sath bhi nahi!\nAgar ghalti se share ho gaya ho to:\n1. Foran official website/app par apna password change karein.\n2. Bank helpline par call kar ke apna card aur account freeze karwayein.\n3. Bank koshish karein ke SMS ya call par OTP mangne walon ko block kar dein."
      : "⚠️ NEVER share your OTP, PIN, or password with anyone — not even bank staff.\n\nIf you accidentally shared it:\n1. Change your account password immediately on the official app/website.\n2. Call your bank hotline right away to freeze your account.\n3. Enable 2-Factor Authentication (2FA) on all active accounts.";
  }

  // Intent 2: Bank scams (HBL, Meezan, Easypaisa, JazzCash, etc.)
  if (/\b(bank|hbl|meezan|ubl|mcb|easypaisa|jazzcash|account|blocked|suspended)\b/i.test(lower)) {
    return useUrdu
      ? "🏦 **Bank Safety ki Zaroori Hidayat:**\n• Pakistan mein banks kabhi SMS ya WhatsApp par account unblock karne ke liye link nahi bhejte.\n• Kisi bhi ghair tasdeeq shuda link par apne login details bilkul darj na karein.\n• Shak hone par apne debit card ke peeche likhi official helpline par call karein."
      : "Key Bank Safety Guidelines:\n• Banks in Pakistan never send SMS links to 'unblock' or 'verify' accounts.\n• Never enter your login details on unfamiliar websites.\n• If you get a suspicious SMS/call, hang up and call your official bank helpline (printed on your debit card).";
  }

  // Intent 3: Suspicious links or websites
  if (/\b(link|url|website|click|http|bit\.ly|tinyurl)\b/i.test(lower)) {
    return useUrdu
      ? "🔗 **Link Check Karne Ka Tareeqa:**\n1. URL ki spelling ghaur se check karein (jaise google.com ki jagah g00gle.xyz ya fake links).\n2. Shortened links (bit.ly, tinyurl) se hamesha ehtiyat karein.\n3. Link ko Phishing Sense ke **Scan** tab mein paste kar ke foran risk score check karein."
      : "How to check if a link is safe:\n1. Inspect the URL domain closely for spelling tricks (e.g. 'paypal-security.xyz' instead of 'paypal.com').\n2. Be cautious with shorteners (bit.ly, tinyurl).\n3. Paste the link into the Phishing Sense 'Scan' tab to analyze its risk score instantly!";
  }

  // Intent 4: BISP / Ehsaas / Prize / Lottery scams
  if (/\b(bisp|benazir|ehsaas|8171|prize|lottery|inam|money|free)\b/i.test(lower)) {
    return useUrdu
      ? "🚨 **BISP aur Inaam Scam Warning:**\n• BISP ya Ehsaas kabhi WhatsApp ya aam mobile numbers se inaam ya paison ka message nahi bhejta.\n• Sirf official 8171 service par tasdeeq karein.\n• Inaam lene ke liye koi 'fee' ya 'tax' kabhi na dein — yeh 100% scam hota hai."
      : "🚨 BISP & Prize Scam Warning:\n• BISP/Ehsaas never notifies winners or sends money via WhatsApp or random mobile numbers.\n• Check official eligibility only at 8171.bisp.gov.pk.\n• Never pay any 'processing fee' or 'tax' to claim a prize.";
  }

  // Default intelligent response
  return useUrdu
    ? "🛡️ Phishing Sense par aapka sawal ahem hai. Agar aapke paas koi mashkook message, web link, email ya phone number hai to use 'Scan' tab mein check karein. Koi bhi idara ya bank aap se phone ya SMS par aapka password ya OTP nahi mangta."
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
