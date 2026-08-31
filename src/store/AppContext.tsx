import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import {
  MOCK_USER,
  MOCK_SCAN_HISTORY,
  MOCK_STATS,
  type ScanResult,
  type ChatMessage,
  mockScanContent,
  AI_QA_PAIRS,
  AI_DEFAULT_RESPONSE,
  AI_DEFAULT_RESPONSE_UR,
} from '../constants/mockData';
import { analyzeContent, toScanResult, sendChatMessageApi, type ApiInputType, type FrontendScanType } from '../services/api';

// ─────────────────────────────────────────────────────────────
//  Auth Context — mock authentication state
// ─────────────────────────────────────────────────────────────

interface AuthUser {
  id:     string;
  name:   string;
  email:  string;
}

interface AuthContextValue {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email: string, password: string) => Promise<void>;
  signup:          (name: string, email: string, password: string) => Promise<void>;
  logout:          () => void;
  sendResetEmail:  (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));
    const trimmedEmail = email.trim();
    const extractedName = trimmedEmail ? trimmedEmail.split('@')[0].replace(/[._-]/g, ' ') : '';
    const formattedName = extractedName ? extractedName.charAt(0).toUpperCase() + extractedName.slice(1) : '';
    setUser({ id: 'user-001', name: formattedName, email: trimmedEmail });
    setLoading(false);
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setUser({ id: MOCK_USER.id, name, email });
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const sendResetEmail = useCallback(async (_email: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    // In a real app, this would call an API
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, sendResetEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────
//  App Context — scan history, stats, AI chat
// ─────────────────────────────────────────────────────────────

export type TextSizePreference = 'normal' | 'large';

interface AppContextValue {
  scanHistory:       ScanResult[];
  stats:             { scansToday: number; totalScans: number; threatsBlocked: number };
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

function getMockAiResponse(text: string, language: string): string {
  // Urdu-script input always gets an Urdu reply, regardless of app language
  const isUrduScript = /[\u0600-\u06FF\u0750-\u077F]/.test(text);
  const useUrdu = language === 'ur' || isUrduScript;
  for (const qa of AI_QA_PAIRS) {
    if (qa.pattern.test(text)) {
      return useUrdu ? (qa.responseUr ?? qa.response) : qa.response;
    }
  }
  return useUrdu ? AI_DEFAULT_RESPONSE_UR : AI_DEFAULT_RESPONSE;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(MOCK_SCAN_HISTORY);
  const [stats, setStats]             = useState(MOCK_STATS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatThinking, setThinking]   = useState(false);
  const [textSize, setTextSizeState]    = useState<TextSizePreference>('normal');
  const [notificationsOn, setNotificationsOn] = useState(true);

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
    setScanHistory(prev => [scan, ...prev].slice(0, 50));
    setStats(prev => ({
      ...prev,
      scansToday:     prev.scansToday + 1,
      totalScans:     prev.totalScans + 1,
      threatsBlocked: scan.risk === 'dangerous' ? prev.threatsBlocked + 1 : prev.threatsBlocked,
    }));
    return scan;
  }, []);

  const sendChatMessage = useCallback(async (text: string, language: string = 'en') => {
    const userMsg: ChatMessage = {
      id: genId(), role: 'user', content: text, timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const apiReply = await sendChatMessageApi(text, language);
      const replyText = apiReply || getMockAiResponse(text, language);
      const aiMsg: ChatMessage = {
        id:        genId(),
        role:      'assistant',
        content:   replyText,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch {
      const aiMsg: ChatMessage = {
        id:        genId(),
        role:      'assistant',
        content:   getMockAiResponse(text, language),
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
        scanHistory, stats, addScan,
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
