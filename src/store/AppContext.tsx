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
} from '../constants/mockData';
import { analyzeContent, toScanResult } from '../services/api';

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
    setUser({ id: MOCK_USER.id, name: MOCK_USER.name, email: email || MOCK_USER.email });
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
  addScan:           (content: string) => Promise<ScanResult>;
  chatMessages:      ChatMessage[];
  sendChatMessage:   (text: string) => void;
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

function getMockAiResponse(text: string): string {
  for (const qa of AI_QA_PAIRS) {
    if (qa.pattern.test(text)) return qa.response;
  }
  return AI_DEFAULT_RESPONSE;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(MOCK_SCAN_HISTORY);
  const [stats, setStats]             = useState(MOCK_STATS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatThinking, setThinking]   = useState(false);
  const [textSize, setTextSizeState]    = useState<TextSizePreference>('normal');
  const [notificationsOn, setNotificationsOn] = useState(true);

  const addScan = useCallback(async (content: string): Promise<ScanResult> => {
    let raw: Omit<ScanResult, 'id' | 'timestamp'>;

    // Try backend API first
    try {
      const apiResponse = await analyzeContent(content, 'text');
      if (apiResponse) {
        raw = toScanResult(content, apiResponse);
      } else {
        // Backend unavailable — fall back to local mock engine
        raw = mockScanContent(content);
      }
    } catch {
      // Any unexpected error — fall back to local mock engine
      raw = mockScanContent(content);
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

  const sendChatMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: genId(), role: 'user', content: text, timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setThinking(true);

    // Simulate AI thinking time
    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id:        genId(),
        role:      'assistant',
        content:   getMockAiResponse(text),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setThinking(false);
    }, delay);
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
