import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { translations, Language } from '../translations';
import { api } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export type Screen = 
  | 'WELCOME' | 'LOGIN' | 'ONBOARDING' | 'EVENTS' | 'EVENT_DETAILS' 
  | 'GAME_BOARD' | 'PROMO_CODE' | 'MY_BOXES' | 'REVEAL' | 'RESULT' 
  | 'PROFILE' | 'SETTINGS' | 'SUPPORT' | 'LEADERBOARD' | 'SHOP'
  | 'VENUE_DASHBOARD' | 'ADMIN_DASHBOARD' | 'PRIZE_SCANNER';

export type UserRole = 'USER' | 'VENUE' | 'ADMIN';

export interface Prize {
  id: string; gameId: string; name: string; description: string; pointsCost: number; image: string; available: boolean;
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
  useAttempt: () => Promise<boolean>;
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

  const defaultUser: User = {
    id: 'me', name: 'Player One', role: 'USER', points: 100, dailyPoints: 0, 
    lastPointsDate: new Date().toDateString(), streak: 3, highScore: 0, 
    attempts: 50, lastAttemptDate: new Date().toDateString(), referrals: 0,
  };
  const [user, setUser] = useState<User>(defaultUser);

  useEffect(() => {
    AsyncStorage.getItem('arena_mock_user').then(saved => {
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch (e) {}
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('arena_mock_user', JSON.stringify(user));
  }, [user]);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionStartTime, setActiveSessionStartTime] = useState<number | null>(null);
  const [gamesStats, setGamesStats] = useState<Record<string, GameLimit>>({});
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('ARENA_RUNNER');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const t = translations[language];

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const pRes = await api.get('/prizes');
        if (pRes.data) setPrizes(pRes.data);
      } catch (e) {}

      const token = await AsyncStorage.getItem('arena_token');
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
          await AsyncStorage.removeItem('arena_token');
        }
      }
    };
    loadRealData();
  }, [screen]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      setScreen('WELCOME');
      // Use alert from react-native instead of window.alert, or just log
    };
    const sub = DeviceEventEmitter.addListener('arena_unauthorized', handleUnauthorized);
    return () => sub.remove();
  }, []);

  const refreshGameStats = async () => {
    try {
      const token = await AsyncStorage.getItem('arena_token');
      if (token) {
        const statsRes = await api.get('/games');
        const statsMap = statsRes.data.reduce((acc: any, g: GameLimit) => ({ ...acc, [g.id]: g }), {});
        setGamesStats(statsMap);
      }
    } catch (e) {}
  };

  const loginWithPhone = async (phone: string, code: string, displayName?: string) => {
    try {
      let deviceId = await AsyncStorage.getItem('arena_device_id');
      if (!deviceId) {
        deviceId = 'mobile-' + Math.random().toString(36).substring(2, 10);
        await AsyncStorage.setItem('arena_device_id', deviceId);
      }
      const res = await api.post('/auth/verify', { phone, code, deviceId, displayName });
      if (res.data.accessToken) {
        await AsyncStorage.setItem('arena_token', res.data.accessToken);
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

  const logout = async () => {
    await AsyncStorage.removeItem('arena_token');
    await AsyncStorage.removeItem('arena_mock_user');
    setUser(defaultUser);
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

  const addPoints = useCallback(async (amount: number): Promise<number> => {
    const { selectedGameId, activeSessionId, gamesStats, activeSessionStartTime } = stateRef.current;
    
    if (amount > 0) {
      const token = await AsyncStorage.getItem('arena_token');
      if (token && activeSessionId) {
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
      } else if (!token) {
        setUser(prev => ({ 
          ...prev, 
          points: prev.points + amount,
        }));
      }
    }
    return amount;
  }, [refreshGameStats]);

  const useAttempt = useCallback(async (): Promise<boolean> => {
    if (user.role === 'ADMIN') return true; 

    const gameStat = gamesStats[selectedGameId];
    if (gameStat && gameStat.attemptsLeft <= 0) return false;
    
    const token = await AsyncStorage.getItem('arena_token');
    if (token) {
      api.post(`/games/${selectedGameId}/start`).then(res => {
        if (res.data?.sessionId) {
          setActiveSessionId(res.data.sessionId);
          setActiveSessionStartTime(Date.now());
        }
        refreshGameStats(); 
      }).catch(() => {});
    }
    
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
