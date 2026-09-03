import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  type ScanResult,
  type ChatMessage,
  mockScanContent,
} from '../constants/mockData';
import {
  analyzeContent,
  toScanResult,
  sendChatMessageApi,
  getScanHistory,
  deleteScanHistory,
  type ApiInputType,
  type FrontendScanType,
  type HistoryItem,
} from '../services/api';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────────────────────
//  App Context — scan history, stats, AI chat
// ─────────────────────────────────────────────────────────────

export type TextSizePreference = 'normal' | 'large';

interface AppContextValue {
  scanHistory:       ScanResult[];
  stats:             { scansToday: number; totalScans: number; threatsBlocked: number };
  isHistoryLoading:  boolean;
  historyError:      string | null;
  refreshHistory:    () => Promise<void>;
  removeScan:        (id: string) => Promise<boolean>;
  addScan:           (content: string, scanType?: FrontendScanType) => Promise<ScanResult>;
  chatMessages:      ChatMessage[];
  sendChatMessage:   (text: string, language?: string) => void;
  isChatThinking:    boolean;
  clearChat:         () => void;
  textSize:          TextSizePreference;
  setTextSize:       (size: TextSizePreference) => void;
  notificationsOn:   boolean;
  setNotifications:  (on: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

let _idCounter = 100;
const genId = () => String(++_idCounter);

function historyItemToScanResult(item: HistoryItem): ScanResult {
  const typeMap: Record<HistoryItem['input_type'], ScanResult['type']> = {
    link: 'url',
    text: 'sms',
    message: 'sms',
    phone: 'phone',
  };

  const verdictMap: Record<HistoryItem['verdict'], ScanResult['risk']> = {
    SAFE: 'safe',
    SUSPICIOUS: 'suspicious',
    DANGEROUS: 'dangerous',
  };

  return {
    id: String(item.id),
    content: item.details?.content_preview || `[${item.input_type}]`,
    type: typeMap[item.input_type] ?? 'sms',
    risk: verdictMap[item.verdict] ?? 'suspicious',
    confidence: item.risk_score,
    timestamp: new Date(item.created_at),
    details: item.details?.explanation_en,
    indicators: item.details?.threat_indicators,
    explanationUr: item.details?.explanation_roman_urdu,
  };
}

function computeStats(history: ScanResult[]) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return {
    scansToday: history.filter(h => h.timestamp >= startOfToday).length,
    totalScans: history.length,
    threatsBlocked: history.filter(h => h.risk === 'dangerous').length,
  };
}

function toApiInputType(scanType: FrontendScanType): ApiInputType {
  if (scanType === 'url') return 'link';
  if (scanType === 'message' || scanType === 'email') return 'message';
  return 'text';
}

function toResultType(scanType: FrontendScanType): ScanResult['type'] {
  if (scanType === 'url') return 'url';
  if (scanType === 'email') return 'email';
  if (scanType === 'phone') return 'phone';
  return 'sms';
}

const OFFLINE_AI_MESSAGE =
  "I'm offline right now, but here's the most important safety rule: never share OTPs, PINs, or passwords with anyone — even if they claim to be from your bank.";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [stats, setStats]             = useState(computeStats([]));
  const [isHistoryLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]       = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatThinking, setThinking]   = useState(false);
  const [textSize, setTextSizeState]    = useState<TextSizePreference>('normal');
  const [notificationsOn, setNotificationsOn] = useState(true);

  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setScanHistory([]);
      setStats(computeStats([]));
      setHistoryError(null);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await getScanHistory(50);
      if (items) {
        const mapped = items.map(historyItemToScanResult);
        setScanHistory(mapped);
        setStats(computeStats(mapped));
      } else {
        // Backend unavailable or not authenticated — keep local state
        setHistoryError('Could not load history. Using local scans only.');
      }
    } catch (err: any) {
      console.warn('[AppContext] refreshHistory failed:', err.message);
      setHistoryError('Could not load history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated]);

  const removeScan = useCallback(async (id: string): Promise<boolean> => {
    const numericId = parseInt(id, 10);
    if (!Number.isFinite(numericId)) return false;

    const ok = await deleteScanHistory(numericId);
    if (ok) {
      setScanHistory(prev => {
        const next = prev.filter(s => s.id !== id);
        setStats(computeStats(next));
        return next;
      });
    }
    return ok;
  }, []);

  // Load persisted history once auth state is known
  useEffect(() => {
    if (isAuthLoading) return;
    refreshHistory();
  }, [isAuthLoading, refreshHistory]);

  const addScan = useCallback(async (
    content: string,
    scanType: FrontendScanType = 'message'
  ): Promise<ScanResult> => {
    let raw: Omit<ScanResult, 'id' | 'timestamp'>;

    try {
      const outcome = await analyzeContent(content, toApiInputType(scanType));
      if (outcome.kind === 'success') {
        raw = toScanResult(content, outcome.response, scanType);
      } else {
        raw = { ...mockScanContent(content), type: toResultType(scanType), isDemoFallback: true };
      }
    } catch {
      raw = { ...mockScanContent(content), type: toResultType(scanType), isDemoFallback: true };
    }

    const scan: ScanResult = { ...raw, id: genId(), timestamp: new Date() };
    setScanHistory(prev => {
      const next = [scan, ...prev].slice(0, 50);
      setStats(computeStats(next));
      return next;
    });
    return scan;
  }, []);

  const sendChatMessage = useCallback(async (text: string, language: string = 'en') => {
    const userMsg: ChatMessage = {
      id: genId(), role: 'user', content: text, timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const replyText = await sendChatMessageApi(text, language);
      const aiMsg: ChatMessage = {
        id:        genId(),
        role:      'assistant',
        content:   replyText || OFFLINE_AI_MESSAGE,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch {
      const aiMsg: ChatMessage = {
        id:        genId(),
        role:      'assistant',
        content:   OFFLINE_AI_MESSAGE,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } finally {
      setThinking(false);
    }
  }, []);

  const clearChat = useCallback(() => setChatMessages([]), []);

  const setTextSize = useCallback((size: TextSizePreference) => setTextSizeState(size), []);
  const setNotifications = useCallback((on: boolean) => setNotificationsOn(on), []);

  return (
    <AppContext.Provider
      value={{
        scanHistory, stats,
        isHistoryLoading, historyError, refreshHistory, removeScan,
        addScan,
        chatMessages, sendChatMessage, isChatThinking, clearChat,
        textSize, setTextSize,
        notificationsOn, setNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
