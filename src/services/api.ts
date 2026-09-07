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

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ScanResult } from '../constants/mockData';
import { redactSensitive, inferContentType } from './redact';
import { supabase } from './supabase';

// ── Configuration ────────────────────────────────────────────
function normalizeApiBaseUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string | null {
  const envUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;

  const configuredUrl = normalizeApiBaseUrl(Constants.expoConfig?.extra?.apiBaseUrl);
  if (configuredUrl) return configuredUrl;

  if (!__DEV__) return null;
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';
}

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Build request headers including the current Supabase access token
 * when a session exists, so protected routes can identify the user.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session.access_token}`,
  };
}
const API_TIMEOUT = 10000;

// ── Types ────────────────────────────────────────────────────

export type ApiInputType = 'text' | 'link' | 'message';
export type FrontendScanType = 'url' | 'message' | 'email' | 'phone';

export interface AnalyzeRequest {
  input:      string;
  input_type: ApiInputType;
}

export interface AnalyzeResponse {
  risk_score:            number;
  verdict:               'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  explanation_en:        string;
  explanation_roman_urdu: string;
  threat_indicators:     string[];
}

export interface HistoryItem {
  id:          number;
  input_hash:  string;
  input_type:  'text' | 'link' | 'message' | 'phone';
  risk_score:  number;
  verdict:     'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  details:     {
    content_full?:       string;
    content_preview?:    string;
    explanation_en?:     string;
    explanation_roman_urdu?: string;
    threat_indicators?:  string[];
    source?:             string;
  };
  created_at:  string;
}

export interface HistoryListResponse {
  history: HistoryItem[];
}

export type AnalyzeOutcome =
  | { kind: 'success'; response: AnalyzeResponse }
  | { kind: 'unavailable'; reason: 'not_configured' | 'server_error' | 'timeout' | 'network_error' };

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

function inferApiInputType(input: string): ApiInputType {
  const inferredType = inferContentType(input);
  if (inferredType === 'url') return 'link';
  if (inferredType === 'email' || inferredType === 'sms') return 'message';
  return 'text';
}

/**
 * Call the backend analyze endpoint.
 *
 * **Privacy**: The input is redacted client-side before being
 * sent over the wire. OTPs, PINs, passwords, CNICs, and credit
 * card numbers are masked so they never reach the backend or any
 * external LLM.
 */
export async function analyzeContent(
  input: string,
  inputType?: ApiInputType
): Promise<AnalyzeOutcome> {
  if (!API_BASE_URL) {
    return { kind: 'unavailable', reason: 'not_configured' };
  }

  const redactedInput = redactSensitive(input);
  const resolvedType = inputType ?? inferApiInputType(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input: redactedInput, input_type: resolvedType }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[API] Server returned ${response.status}`);
      return { kind: 'unavailable', reason: 'server_error' };
    }

    return { kind: 'success', response: await response.json() as AnalyzeResponse };
  } catch (error: unknown) {
    const reason = error instanceof Error && error.name === 'AbortError'
      ? 'timeout'
      : 'network_error';
    console.warn(`[API] Backend unavailable: ${reason}`);
    return { kind: 'unavailable', reason };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if the backend server is reachable.
 */
export async function isBackendAvailable(): Promise<boolean> {
  if (!API_BASE_URL) return false;

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

function mapScanType(scanType: FrontendScanType): ScanResult['type'] {
  switch (scanType) {
    case 'url': return 'url';
    case 'email': return 'email';
    case 'phone': return 'phone';
    default: return 'sms';
  }
}

/**
 * Convert an API response and original input into a ScanResult.
 */
export function toScanResult(
  originalInput: string,
  response: AnalyzeResponse,
  scanType: FrontendScanType
): Omit<ScanResult, 'id' | 'timestamp'> {
  return {
    content:       originalInput,
    type:          mapScanType(scanType),
    risk:          mapVerdict(response.verdict),
    confidence:    response.risk_score,
    details:       response.explanation_en,
    indicators:    response.threat_indicators,
    explanationUr: response.explanation_roman_urdu,
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
  if (!API_BASE_URL) return null;

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
  if (!API_BASE_URL) return null;

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
  if (!API_BASE_URL) return 0;

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

/**
 * Send a chat message to Sense AI backend (/api/chat).
 * Returns response string or null if unavailable.
 */
export async function sendChatMessageApi(
  message: string,
  language: string = 'en'
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    return data.reply || null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ── Scan History ──────────────────────────────────────────────

/**
 * Fetch the authenticated user's scan history from the backend.
 * Returns null if the backend is unavailable or the user is not signed in.
 */
export async function getScanHistory(limit: number = 50): Promise<HistoryItem[] | null> {
  if (!API_BASE_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      console.warn('[API] getScanHistory unauthorized');
      return null;
    }
    if (!response.ok) {
      console.warn(`[API] history returned ${response.status}`);
      return null;
    }

    const data = (await response.json()) as HistoryListResponse;
    return data.history || [];
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[API] getScanHistory failed:', err.message);
    return null;
  }
}

/**
 * Persist a scan result to the backend history.
 * Returns the created HistoryItem or null if unavailable.
 */
export async function saveScanHistory(
  input: string,
  inputType: ApiInputType,
  response: AnalyzeResponse
): Promise<HistoryItem | null> {
  if (!API_BASE_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/api/history`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input,
        input_type: inputType,
        risk_score: response.risk_score,
        verdict: response.verdict,
        details: {
          content_full: input,
          content_preview: input.slice(0, 200),
          explanation_en: response.explanation_en,
          explanation_roman_urdu: response.explanation_roman_urdu,
          threat_indicators: response.threat_indicators,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[API] saveScanHistory returned ${res.status}`);
      return null;
    }

    const data = (await res.json()) as HistoryListResponse;
    return data.history?.[0] ?? null;
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[API] saveScanHistory failed:', err.message);
    return null;
  }
}

/**
 * Delete a scan history item owned by the authenticated user.
 * Returns true on success.
 */
export async function deleteScanHistory(id: number): Promise<boolean> {
  if (!API_BASE_URL) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = await authHeaders();
    const response = await fetch(`${API_BASE_URL}/api/history/${id}`, {
      method: 'DELETE',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return response.ok;
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[API] deleteScanHistory failed:', err.message);
    return false;
  }
}
