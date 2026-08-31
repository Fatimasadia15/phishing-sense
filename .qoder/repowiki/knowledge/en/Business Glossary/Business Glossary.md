---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Phishing Sense
- Definition：The product name for the AI-powered cyber safety companion that evaluates suspicious text, SMS/WhatsApp messages, links, and phone numbers for fraud risk and explains results in simple language for non-technical users, especially senior citizens in Pakistan.

### risk score
- Definition：A numeric threat assessment from 0–100 produced by the combined rule engine and optional LLM analysis. Mapped to three verdict buckets: 0–30 = SAFE, 31–70 = SUSPICIOUS, 71–100 = DANGEROUS.

### verdict
- Definition：The normalized risk classification returned by the analysis pipeline: one of SAFE, SUSPICIOUS, or DANGEROUS, derived from the risk score and used to drive UI presentation.

### threat indicators
- Definition：A list of short human-readable reasons why content was flagged (e.g., suspicious domain, urgent language, OTP request), returned alongside the verdict to explain the result to the user.

### Roman Urdu
- Definition：Urdu written using the Latin alphabet (code-switched speech/text). The system supports analyzing and explaining risks in Roman Urdu alongside English and formal Urdu, matching how many Pakistani users type messages.
- Aliases：roman urdu

### privacy redaction
- Definition：Client-side masking of sensitive values (OTP codes, PINs, passwords, CNIC numbers, credit card numbers, authorization codes) before any data leaves the device or reaches the backend/LLM. Original sensitive values are never stored or transmitted; only masked text is sent for scam analysis.
- Aliases：redaction、redactSensitive

### demo fallback
- Definition：Deterministic mock scenarios (fake bank warnings, fake government/BISP messages, suspicious delivery links, OTP scams, legitimate transactional messages) used when the backend or LLM is unavailable, clearly labeled as demo so users do not confuse heuristic results with verified community/database information.
- Aliases：mock fallback、offline demo

### community scam reporting
- Definition：A feature allowing users to report suspected scams to a shared community feed, with duplicate detection and a public counter showing how many others reported the same identifier (text, link, or phone number).
- Aliases：community report、reportToCommunity

### Pakistani phone-number check
- Definition：Phone number validation and risk scoring specific to Pakistani formats, returning normalized form, international format, carrier info, validity, and a risk verdict.
- Aliases：checkNumber、phone check
