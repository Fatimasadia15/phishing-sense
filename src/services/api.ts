// ─────────────────────────────────────────────────────────────
//  API Service — Connects frontend to backend /api/analyze
//  Falls back to local mock data when backend is unavailable.
// ─────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import type { ScanResult } from '../constants/mockData';

// ── Configuration ────────────────────────────────────────────
// Use the machine's LAN IP for physical device testing.
// For simulator/emulator, localhost works.
const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000' // Android emulator maps to host
    : 'http://localhost:3000';

const ANALYZE_TIMEOUT = 10000; // 10 seconds

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

// ── API Functions ────────────────────────────────────────────

/**
 * Call the backend analyze endpoint.
 * Returns null if the backend is unavailable.
 */
export async function analyzeContent(
  input: string,
  inputType: 'text' | 'link' | 'message'
): Promise<AnalyzeResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        input_type: inputType,
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
 * Infer the scan type from input content (for frontend display).
 */
function inferType(input: string): ScanResult['type'] {
  const lower = input.toLowerCase().trim();
  if (lower.startsWith('http://') || lower.startsWith('https://') || /^[\w-]+\.[a-z]{2,}/i.test(lower)) {
    return 'url';
  }
  if (lower.includes('@') && !lower.startsWith('http')) return 'email';
  if (/^\+?[\d\s\-()]+$/.test(input.trim())) return 'phone';
  return 'sms';
}

/**
 * Convert an API response + input into a ScanResult for the frontend.
 */
export function toScanResult(
  input: string,
  response: AnalyzeResponse
): Omit<ScanResult, 'id' | 'timestamp'> {
  return {
    content:    input,
    type:       inferType(input),
    risk:       mapVerdict(response.verdict),
    confidence: response.risk_score,
    details:    response.explanation_en,
  };
}
