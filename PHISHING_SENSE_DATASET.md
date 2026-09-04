# 🛡️ Phishing Sense — Scam & Threat Detection Dataset

**Version:** 1.0.0  
**Target Region:** Pakistan & South Asia  
**Supported Languages:** English, Urdu (اردو), Roman Urdu  
**Format:** Documentation & CSV Export  

---

## 1. Scam SMS & Messages Dataset

| Sample ID | Threat Category | Language | Message Snippet | Risk Verdict | Risk Score | Key Threat Indicators |
|---|---|---|---|---|---|---|
| `SMS-001` | Bank Impersonation | English | *ALERT: Your HBL Account #4829 has been locked due to suspicious activity. Verify immediately at http://hbl-verify-security.xyz* | 🚨 **DANGEROUS** | 95% | Pretends to be HBL Bank; Fake urgency; Suspicious `.xyz` TLD |
| `SMS-002` | Bank Impersonation | Roman Urdu | *Aap ka Meezan Bank account temporary suspend ho gaya hai. Abhi account update karein: http://meezan-bank-online-update.info* | 🚨 **DANGEROUS** | 92% | Fake suspension threat in Roman Urdu; Phishing URL |
| `SMS-003` | Government Grant (BISP) | Roman Urdu | *Mubarak ho! BISP Ehsaas Program ki taraf se 25,000 PKR qist manzoor ho chuki hai. Claim: http://bisp-claim-8171.site* | 🚨 **DANGEROUS** | 94% | Unsolicited government stipend claim; Fake 8171 domain |
| `SMS-004` | Government Grant (BISP) | Urdu | *مبارک ہو! بینظیر انکم سپورٹ پروگرام کی طرف سے 35,000 روپے کی مالی امداد منظور ہو گئی ہے۔: http://bisp-8171-pak.site* | 🚨 **DANGEROUS** | 94% | Urdu script government scam; Fake stipend link |
| `SMS-005` | OTP / Credential Theft | Roman Urdu | *Assalam-o-Alaikum, Main JazzCash support se baat kar raha hoon. Aap ke number par OTP aaya hai, jaldi share karein.* | 🚨 **DANGEROUS** | 98% | Impersonating JazzCash support; Direct OTP request |
| `SMS-006` | Lottery / Prize Scam | English | *CONGRATULATIONS! You won a Toyota Prado in Jeeto Pakistan. Claim fee 15,000 PKR via EasyPaisa to 0300-1234567.* | 🚨 **DANGEROUS** | 96% | Unsolicited lottery prize; Requests advance payment |
| `SMS-007` | Parcel Courier | English | *Leopards Courier: Your shipment PK-94821 could not be delivered. Update address: http://bit.ly/leopards-pkg-update* | ⚠️ **SUSPICIOUS** | 75% | Shortened URL masking true destination; Delivery pressure |
| `SMS-008` | Genuine Transaction | English | *Dear Customer, PKR 4,500.00 debited from Account **4921 on 04-SEP-26. Ref: POS-GROCERY. If not you, call 111-000-425.* | ✅ **SAFE** | 5% | Standard bank transaction receipt with official helpline |
| `SMS-009` | Genuine OTP | English | *Your EasyPaisa login OTP is 482910. Valid 3 mins. NEVER share this code with anyone.* | ✅ **SAFE** | 10% | Official OTP notice containing explicit warning not to share |

---

## 2. Phishing vs. Verified Safe URL Dataset

| URL Sample | Classification | Target Brand | Risk Verdict | Risk Score | Technical Reason |
|---|---|---|---|---|---|
| `http://hbl-verify-security.xyz/login` | Typosquatting | HBL Bank | 🚨 **DANGEROUS** | 95% | Uses `.xyz` TLD combined with brand name in subdomain |
| `http://paypa1-security-update.com` | Character Substitution | PayPal | 🚨 **DANGEROUS** | 92% | Replaces letter `l` with digit `1` (`paypa1`) |
| `http://meezan-login-portal.info/auth` | Fake Portal | Meezan Bank | 🚨 **DANGEROUS** | 90% | Unofficial `.info` TLD hosting credential harvester |
| `http://bit.ly/3x8AbCd` | URL Shortener | Unknown | ⚠️ **SUSPICIOUS** | 65% | Hides real destination behind redirection shortener |
| `https://www.hbl.com/personal-banking` | Official Verified | HBL Bank | ✅ **SAFE** | 0% | Verified official domain with valid SSL certificate |
| `https://8171.bisp.gov.pk/` | Official Government | BISP | ✅ **SAFE** | 0% | Verified official Government of Pakistan domain (`.gov.pk`) |

---

## 3. High-Risk Caller & Phone Lookup Dataset

| Phone Number | Number Type | Origin / Association | Verdict | Risk Score | Details |
|---|---|---|---|---|---|
| `+1 (800) 555-0199` | Spoofed Test Line | North America (555-01XX) | 🚨 **DANGEROUS** | 95% | Reserved 555 line spoofed by robocall software for bank scams |
| `+92 300 1234567` | Reported Scammer | Pakistan (Mobilink) | 🚨 **DANGEROUS** | 88% | Reported 42+ times by community for fake 8171 calls |
| `+92 311 9876543` | Robocall Spammer | Pakistan (Zong) | 🚨 **DANGEROUS** | 85% | Automated voice call claiming lottery rewards |
| `111-225-111` | Official Bank UAN | UBL Pakistan | ✅ **SAFE** | 0% | Verified official Universal Access Number helpline |

---

## 4. Sense AI Safety Assistant Q&A Benchmark

### Sample 1: OTP Leak Emergency
* **User Query (EN):** *"I accidentally shared my OTP over the phone, what should I do?"*
* **User Query (UR):** *"میں نے غلطی سے اپنا OTP فون پر بتا دیا ہے، اب مجھے کیا کرنا چاہیے؟"*
* **AI Guidance:** 
  1. Change your online banking password immediately.
  2. Call your bank hotline right away to freeze your account/cards.
  3. Enable 2-Factor Authentication on all connected accounts.
  4. File a complaint with FIA Cybercrime Helpline (1991).

---

## 5. CSV Format Version

The corresponding CSV dataset file is saved at [`server/data/phishing_sense_dataset.csv`](file:///c:/Users/LENOVO/OneDrive/Desktop/phishing-sense/server/data/phishing_sense_dataset.csv).
