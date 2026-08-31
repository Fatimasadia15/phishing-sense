// ─────────────────────────────────────────────────────────────
//  API Service — Connects frontend to backend /api/analyze
//
//  Flow:
//    1. Raw text enters the scanner
//    2. Client-side redaction strips OTP/PIN/passwords/etc.
//    3. Redacted text is sent to the backend API
//    4. Backend runs rule engine + optional LLM on redacted text
//    5. Original sensitive values NEVER leave the device
//
//  When backend is unavailable, falls back to local demo engine.
// ─────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import type { ScanResult } from '../constants/mockData';
import { redactSensitive, inferContentType } from './redact';

// ── Configuration ────────────────────────────────────────────
// Use the machine's LAN IP for physical device testing.
// For simulator/emulator, localhost works.
const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000' // Android emulator maps to host
    : 'http://localhost:3000';

const API_TIMEOUT = 10000;

// ── Types ────────────────────────────────────────────────────

export interface AnalyzeRequest {
  input:      string;
  input_type: 'text' | 'link' | 'message';
}

export interface AnalyzeResponse {
  risk_score:            number;
  verdict:               'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  explanation_en:        string;
  explanation_roman_urdu: string;
  threat_indicators:     string[];
}

export interface CheckNumberResponse {
  normalized_number: string | null;
  international:     string | null;
  valid:             boolean;
  carrier:           string | null;
  risk_score:        number;
  verdict:           'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  reason:            string;
  reason_roman_urdu: string;
  community_reports: number;
}

export interface CommunityReportResponse {
  success:   boolean;
  message:   string;
  count:     number;
  duplicate: boolean;
}

// ── API Functions ────────────────────────────────────────────

/**
 * Call the backend analyze endpoint.
 *
 * **Privacy**: The input is redacted client-side before being
 * sent over the wire.  OTPs, PINs, passwords, CNICs, and credit
 * card numbers are masked so they never reach the backend or any
 * external LLM.
 *
 * Returns null if the backend is unavailable.
 */
export async function analyzeContent(
  input: string,
  inputType?: 'text' | 'link' | 'message'
): Promise<AnalyzeResponse | null> {
  // ── Client-side redaction: strip secrets before submission ──
  const redactedInput = redactSensitive(input);

  // Auto-detect type if not explicitly provided
  const resolvedType = inputType ?? inferContentType(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: redactedInput,     // ← redacted, not raw
        input_type: resolvedType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[API] Server returned ${response.status}`);
      return null;
    }

    const data: AnalyzeResponse = await response.json();
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[API] Request timed out');
    } else {
      console.warn('[API] Backend unavailable:', err.message);
    }
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Check if the backend server is reachable.
 */
export async function isBackendAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

// ── Response Mapping ─────────────────────────────────────────

/**
 * Map the backend verdict to the frontend ScanResult risk field.
 */
function mapVerdict(verdict: string): ScanResult['risk'] {
  switch (verdict) {
    case 'SAFE':       return 'safe';
    case 'SUSPICIOUS': return 'suspicious';
    case 'DANGEROUS':  return 'dangerous';
    default:           return 'suspicious';
  }
}

/**
 * Convert an API response + original input into a ScanResult.
 * The original (un-redacted) input is stored for display so the
 * user sees what they pasted, not the masked version.
 */
export function toScanResult(
  originalInput: string,
  response: AnalyzeResponse
): Omit<ScanResult, 'id' | 'timestamp'> {
  return {
    content:    originalInput,
    type:       inferContentType(originalInput),
    risk:       mapVerdict(response.verdict),
    confidence: response.risk_score,
    details:    response.explanation_en,
  };
}

// ── Number Check ──────────────────────────────────────────────

/**
 * Check a Pakistani phone number for risk.
 * Returns null if the backend is unavailable.
 */
export async function checkPhoneNumber(
  phoneNumber: string
): Promise<CheckNumberResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/check-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[API] check-number returned ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[API] check-number failed:', err.message);
    return null;
  }
}

// ── Community Reporting ───────────────────────────────────────

/**
 * Report content as a scam to the community.
 * Returns null if the backend is unavailable.
 */
export async function reportToCommunity(
  contentType: 'text' | 'link' | 'phone',
  identifier: string
): Promise<CommunityReportResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/community/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: contentType, identifier }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[API] community/report returned ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[API] community/report failed:', err.message);
    return null;
  }
}

/**
 * Get the community report count for an identifier.
 * Returns 0 if the backend is unavailable.
 */
export async function getCommunityCount(
  identifier: string
): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/community/count?identifier=${encodeURIComponent(identifier)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) return 0;

    const data = await response.json();
    return data.count || 0;
  } catch {
    clearTimeout(timeout);
    return 0;
  }
}
