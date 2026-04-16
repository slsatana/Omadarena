import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { translations, Language } from '../translations';
import { api } from '../api';

export type Screen = 
  | 'WELCOME' | 'LOGIN' | 'ONBOARDING' | 'EVENTS' | 'EVENT_DETAILS' 
  | 'GAME_BOARD' | 'PROMO_CODE' | 'MY_BOXES' | 'REVEAL' | 'RESULT' 
  | 'PROFILE' | 'SETTINGS' | 'SUPPORT' | 'LEADERBOARD' | 'SHOP'
  | 'VENUE_DASHBOARD' | 'ADMIN_DASHBOARD' | 'PRIZE_SCANNER' | 'MY_PRIZES';

export type UserRole = 'USER' | 'VENUE' | 'ADMIN';

export interface Prize {
  id: string; gameId: string; name: string; description: string; pointsCost: number; image: string; hiddenImageUrl?: string; available: boolean;
}

export interface User {
  id: string; name: string; role: UserRole; points: number; dailyPoints: number; lastPointsDate: string; streak: number; highScore: number; attempts: number; lastAttemptDate: string; referrals: number; venueGameId?: string;
}

export interface GameLimit {
  id: string;
  name: string;
  venueNetworkName: string;
  attemptsUsedToday: number;
  attemptsLeft: number;
  pointsEarnedToday: number;
  dailyPointsLimit: number;
  imageUrl?: string;
  displayName?: string;
}

interface GameContextType {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  user: User;
  setUser: (user: User) => void;
  addPoints: (amount: number) => number;
  useAttempt: () => boolean;
  updateHighScore: (score: number) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedGameId: string;
  setSelectedGameId: (id: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  prizes: Prize[];
  setPrizes: (prizes: Prize[]) => void;
  gamesStats: Record<string, GameLimit>;
  refreshGameStats: () => Promise<void>;
  t: any;
  loginWithPhone: (phone: string, code: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState<Screen>('WELCOME');
  const [language, setLanguage] = useState<Language>('ru');

  const [user, setUser] = useState<User>(() => {
    const saved = sessionStorage.getItem('arena_mock_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'me', name: 'Player One', role: 'USER', points: 100, dailyPoints: 0, 
      lastPointsDate: new Date().toDateString(), streak: 3, highScore: 0, 
      attempts: 50, lastAttemptDate: new Date().toDateString(), referrals: 0,
    };
  });

  // Sync mock user to sessionStorage to keep roles isolated per tab
  useEffect(() => {
    sessionStorage.setItem('arena_mock_user', JSON.stringify(user));
  }, [user]);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionStartTime, setActiveSessionStartTime] = useState<number | null>(null);

  const [gamesStats, setGamesStats] = useState<Record<string, GameLimit>>({});

  const [prizes, setPrizes] = useState<Prize[]>([]);

  const [selectedGameId, setSelectedGameId] = useState<string>('ARENA_RUNNER');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const t = translations[language];

  // API Intercept: Try to load real data
  useEffect(() => {
    const loadRealData = async () => {
      try {
        const pRes = await api.get('/prizes');
        if (pRes.data) setPrizes(pRes.data);
      } catch (e) {
        console.error("Failed to load prizes", e);
      }

      const token = sessionStorage.getItem('arena_token') || localStorage.getItem('arena_token');
      if (token) {
        try {
          const [res, statsRes] = await Promise.all([
            api.get('/auth/me'),
            api.get('/games')
          ]);
          setUser(prev => ({
            ...prev,
            id: res.data.id,
            name: res.data.displayName || res.data.phone,
            role: res.data.role || 'USER',
            points: Number(res.data.points),
            attempts: 50
          }));
          const statsMap = statsRes.data.reduce((acc: any, g: GameLimit) => ({ ...acc, [g.id]: g }), {});
          setGamesStats(statsMap);

          if (screen === 'WELCOME' || screen === 'LOGIN') {
            setScreen('EVENTS');
          }
        } catch {
          sessionStorage.removeItem('arena_token');
          localStorage.removeItem('arena_token');
        }
      }
    };
    loadRealData();
  }, [screen]);

  // Global Listener for Unauthorized Access (Cross-device kicks)
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      setScreen('WELCOME');
      setTimeout(() => alert(t.errors?.otherDevice || 'Вход выполнен с другого устройства. Ваша сессия завершена.'), 100);
    };
    window.addEventListener('arena_unauthorized', handleUnauthorized as any);
    return () => window.removeEventListener('arena_unauthorized', handleUnauthorized as any);
  }, []);

  const refreshGameStats = async () => {
    try {
      if (localStorage.getItem('arena_token') || sessionStorage.getItem('arena_token')) {
        const statsRes = await api.get('/games');
        const statsMap = statsRes.data.reduce((acc: any, g: GameLimit) => ({ ...acc, [g.id]: g }), {});
        setGamesStats(statsMap);
      }
    } catch (e) {}
  };

  const loginWithPhone = async (phone: string, code: string, displayName?: string) => {
    try {
      let deviceId = localStorage.getItem('arena_device_id');
      if (!deviceId) {
        deviceId = 'web-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('arena_device_id', deviceId);
      }
      const res = await api.post('/auth/verify', { phone, code, deviceId, displayName });
      if (res.data.accessToken) {
        sessionStorage.setItem('arena_token', res.data.accessToken);
        localStorage.setItem('arena_token', res.data.accessToken);
        const p = await api.get('/auth/me');
        setUser(prev => ({ ...prev, id: p.data.id, name: p.data.displayName || p.data.phone, role: p.data.role || 'USER', points: Number(p.data.points), attempts: 50 }));
        setScreen('ONBOARDING');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('arena_token');
    localStorage.removeItem('arena_token');
    sessionStorage.removeItem('arena_mock_user');
    setUser({
      id: 'me', name: 'Player One', role: 'USER', points: 100, dailyPoints: 0, 
      lastPointsDate: new Date().toDateString(), streak: 3, highScore: 0, 
      attempts: 50, lastAttemptDate: new Date().toDateString(), referrals: 0,
    });
  };

  const stateRef = useRef({
    selectedGameId,
    activeSessionId,
    gamesStats,
    activeSessionStartTime
  });

  useEffect(() => {
    stateRef.current = {
      selectedGameId,
      activeSessionId,
      gamesStats,
      activeSessionStartTime
    };
  }, [selectedGameId, activeSessionId, gamesStats, activeSessionStartTime]);

  const addPoints = useCallback((amount: number): number => {
    const { selectedGameId, activeSessionId, gamesStats, activeSessionStartTime } = stateRef.current;
    const gameStat = gamesStats[selectedGameId];
    
    if (amount > 0) {
      if (localStorage.getItem('arena_token') && activeSessionId) {
        const timePlayedSeconds = Math.max(1, Math.floor((Date.now() - (activeSessionStartTime || Date.now() - 60000)) / 1000));
        
        api.post(`/games/${selectedGameId}/submit`, { 
          sessionId: activeSessionId,
          score: amount, 
          timePlayedSeconds
        }, { headers: { 'idempotency-key': 'idemp_' + Date.now() }})
        .then((submitRes) => {
          api.get('/auth/me').then(res => {
            setUser(prev => ({ ...prev, points: Number(res.data.points) }));
          });
          refreshGameStats();
          setActiveSessionId(null);
          setActiveSessionStartTime(null);
        }).catch(() => {});
      } else if (!localStorage.getItem('arena_token')) {
        // Optimistic user update ONLY if not logged in
        setUser(prev => ({ 
          ...prev, 
          points: prev.points + amount,
        }));
      }
    }
    return amount;
  }, [refreshGameStats]);

  const useAttempt = useCallback((): boolean => {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true; 

    // Server-side limits validation fallback mapping
    const gameStat = gamesStats[selectedGameId];
    if (gameStat && gameStat.attemptsLeft <= 0) return false;
    
    if (localStorage.getItem('arena_token')) {
      api.post(`/games/${selectedGameId}/start`).then(res => {
        if (res.data?.sessionId) {
          setActiveSessionId(res.data.sessionId);
          setActiveSessionStartTime(Date.now());
        }
        refreshGameStats(); // Refresh local counts instantly
      }).catch(() => {});
    }
    // Optimistic UI update for games stats
    setGamesStats(prev => {
      const g = prev[selectedGameId];
      if (!g) return prev;
      return {
        ...prev,
        [selectedGameId]: {
          ...g,
          attemptsLeft: Math.max(0, g.attemptsLeft - 1),
          attemptsUsedToday: g.attemptsUsedToday + 1
        }
      };
    });
    
    return true;
  }, [user.role, selectedGameId, gamesStats]);

  const updateHighScore = useCallback((score: number) => setUser(p => ({ ...p, highScore: Math.max(p.highScore, score) })), []);

  return (
    <GameContext.Provider value={{
      screen, setScreen, user, setUser, addPoints, useAttempt, updateHighScore,
      language, setLanguage, selectedGameId, setSelectedGameId, theme, setTheme,
      prizes, setPrizes, gamesStats, refreshGameStats, t, loginWithPhone, logout
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('ERR');
  return context;
};
