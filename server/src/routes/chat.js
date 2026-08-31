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

  // Intent 1: OTP / PIN / Password compromised or asked
  if (/\b(otp|pin|password|passwd|code|verification)\b/i.test(lower)) {
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
    ? "آپ کا آن لائن تحفظ کے حوالے سے سوال اہم ہے۔ اگر آپ کے پاس کوئی مشکوک میسج، لنک یا فون نمبر ہے تو اسے 'Scan' سکرین میں چیک کریں۔ کسی بھی پریشانی کی صورت میں اپنی سیکیورٹی معلومات (پاس ورڈ/او ٹی پی) محفوظ رکھیں۔"
    : "That's an important question about online safety. If you have received a suspicious text, email, link, or phone number, paste it into the 'Scan' tab for immediate risk analysis. Remember: legitimate services will never pressure you to share sensitive codes or passwords.";
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
