import { 
  Trophy, 
  User as UserIcon, 
  Grid, 
  Ticket, 
  ChevronRight, 
  Flame, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Gift,
  Languages,
  Sun,
  Smartphone,
  Zap,
  Gamepad2,
  Music,
  ShoppingBag,
  Ticket as TicketIcon,
  ShieldCheck,
  ArrowUpDown,
  Rocket,
  Medal,
  ChevronUp,
  Speaker,
  Volume2,
  Smartphone as Vibrate,
  MessageCircle,
  Send,
  ExternalLink,
  HelpCircle,
  Lock,
  FileText,
  Trash2,
  QrCode,
  Camera,
  Layers,
  Shield,
  Users,
  Settings,
  Bell,
  GitCommit,
  Sparkles,
  Puzzle,
  FlaskConical,
  Scan,
  XCircle,
  History
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useGame, UserRole } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageSwitcher, ScreenWrapper, Button, BackButton } from './Shared';
import { Logo } from './Logo';
import { Games, GameId } from '../games';
import { ShopContent } from './ShopContent';
import { api } from '../api';

// --- SCREENS ---

export const WelcomeScreen = () => {
  const { setScreen, t } = useGame();
  return (
    <ScreenWrapper>
      <div className="absolute top-0 right-6 z-50 flex gap-3 safe-top">
        <LanguageSwitcher />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden safe-top safe-bottom">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black z-10" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.3 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover opacity-40 blur-[2px]"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-20 w-full max-w-md flex flex-col items-center safe-top safe-bottom"
        >
          <div className="w-48 h-48 mb-10 relative">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-[var(--primary)] blur-3xl rounded-full" 
            />
            <Logo className="w-full h-full text-[var(--primary)] relative z-10 drop-shadow-[0_0_30px_rgba(10,132,255,0.8)]" />
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-5xl font-black tracking-tighter mb-4 text-white uppercase italic leading-none drop-shadow-lg">
              {t.welcome.title}
            </h1>
            <div className="w-20 h-1 bg-[var(--primary)] mx-auto mb-6 rounded-full shadow-[0_0_10px_var(--primary)]" />
            <p className="text-white/70 text-lg mb-10 font-medium leading-relaxed max-w-[300px] mx-auto">
              {t.welcome.desc}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="w-full space-y-4"
          >
            <Button onClick={() => setScreen('LOGIN')} className="w-full py-5 text-xl rounded-[24px] shadow-[0_10px_30px_rgba(10,132,255,0.3)]">
              {t.welcome.getStarted}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </ScreenWrapper>
  );
};

export const LoginScreen = () => {
  const { setScreen, t, loginWithPhone } = useGame();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (step === 'phone') {
      if (mode === 'REGISTER' && !displayName.trim()) {
        setError('Please enter your nickname');
        return;
      }
      if (phone.length < 13) {
        setError('Неверный формат номера');
        return;
      }
      try {
        setLoading(true);
        const res = await api.post('/auth/send-sms', { phone });
        if (res.data.isAdmin) setIsAdminLogin(true);
        setStep('code');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send SMS');
      } finally {
        setLoading(false);
      }
    } else {
      if (!isAdminLogin && code.length !== 6) {
        setError('Код должен состоять из 6 цифр');
        return;
      }
      setLoading(true);
      const success = await loginWithPhone(phone, code, mode === 'REGISTER' ? displayName : undefined);
      setLoading(false);
      if (!success) setError('Invalid Code');
    }
  };

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-4">
          <BackButton onClick={() => setScreen('WELCOME')} />
          <div className="flex gap-3">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">{mode === 'REGISTER' ? t.login.signUp || 'Register' : t.login.title}</h2>
          <p className="text-[var(--text-muted)] text-sm font-medium">{mode === 'REGISTER' ? 'Create a new account' : t.login.desc}</p>
        </div>
        
        <div className="space-y-3 mb-auto">
            {step === 'phone' ? (
            <>
              {mode === 'REGISTER' && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[var(--text-muted)] ml-1">Nickname</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="PlayerOne"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all text-base font-medium"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[var(--text-muted)] ml-1">{t.login.phone}</label>
                <div className="flex gap-3">
                  <input 
                    type="tel" 
                    placeholder="+99890..."
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, '');
                      if (!val.startsWith('+998')) val = '+998';
                      if (val.length > 13) val = val.slice(0, 13);
                      setPhone(val);
                    }}
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all text-base font-medium"
                  />
                </div>
              </div>
            </>
            ) : (
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[var(--text-muted)] ml-1">SMS Code</label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={isAdminLogin ? undefined : 6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all text-base font-medium text-center tracking-widest"
                />
              </div>
            </div>
            )}
            {error && <p className="text-[var(--danger)] text-sm ml-1 font-semibold">{error}</p>}
        </div>

        <div className="mt-6 space-y-3">
          <Button onClick={handleLogin} disabled={loading} className="w-full py-4 text-base rounded-[20px]">
            {loading ? 'Processing...' : step === 'phone' ? 'Send SMS' : (mode === 'REGISTER' ? 'Register Account' : t.login.signIn)}
          </Button>
          <p className="text-center text-[14px] text-[var(--text-muted)] font-medium">
            {mode === 'LOGIN' ? t.login.noAccount : 'Already have an account?'}
            <button 
              onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setStep('phone'); setError(''); }} 
              className="text-[var(--primary)] font-bold ml-1"
            >
              {mode === 'LOGIN' ? t.login.signUp : t.login.signIn}
            </button>
          </p>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const OnboardingScreen = () => {
  const { setScreen, t } = useGame();
  const [step, setStep] = useState(0);
  
  const slides = [
    {
      title: t.onboarding[0].title,
      desc: t.onboarding[0].desc,
      icon: <Gamepad2 size={56} className="text-[var(--primary)]" />
    },
    {
      title: t.onboarding[1].title,
      desc: t.onboarding[1].desc,
      icon: <Grid size={56} className="text-[var(--secondary)]" />
    },
    {
      title: t.onboarding[2].title,
      desc: t.onboarding[2].desc,
      icon: <Trophy size={56} className="text-[var(--success)]" />
    }
  ];

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else setScreen('EVENTS');
  };

  return (
    <ScreenWrapper>
      <div className="flex-1 flex flex-col p-6 safe-top safe-pb">
        <div className="flex justify-between items-center mb-6">
          <LanguageSwitcher />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-[var(--surface)] rounded-[32px] flex items-center justify-center mb-6 border border-[var(--border)] shadow-xl">
                {slides[step].icon}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-2">{slides[step].title}</h2>
              <p className="text-[var(--text-muted)] text-sm max-w-[260px] font-medium leading-tight">{slides[step].desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-6">
          <div className="flex gap-2.5">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-[var(--primary)]' : 'w-2 bg-[var(--border)]'}`} 
              />
            ))}
          </div>
          <Button onClick={next} className="px-10 rounded-2xl">
            {step === slides.length - 1 ? t.common.finish : t.common.next}
          </Button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const EventsListScreen = () => {
  const { setScreen, setSelectedGameId, t, user, gamesStats } = useGame();
  
    const staticArenas = [
      { 
        id: 1, 
        gameId: 'ARENA_RUNNER',
        title: t.gameDetails.ARENA_RUNNER.title, 
        status: t.events.active, 
        icon: <Flame className="text-[var(--primary)]" size={28} />, 
        color: "bg-[var(--primary)]/10", 
        date: "3d",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400"
      },
      { 
        id: 2, 
        gameId: 'NEON_JUMP', 
        title: t.gameDetails.NEON_JUMP.title, 
        status: t.events.active, 
        icon: <Rocket className="text-[var(--arena-cyan)]" size={28} />, 
        color: "bg-[var(--arena-cyan)]/10", 
        date: "5d", 
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 3, 
        gameId: 'CYBER_SHIELD', 
        title: t.gameDetails.CYBER_SHIELD.title, 
        status: t.events.active, 
        icon: <ShieldCheck className="text-[var(--secondary)]" size={28} />, 
        color: "bg-[var(--secondary)]/10", 
        date: "End", 
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 4, 
        gameId: 'HIGHER_LOWER', 
        title: t.higherLower?.title || "Higher Lower", 
        status: t.events.active, 
        icon: <ArrowUpDown className="text-orange-500" size={28} />, 
        color: "bg-orange-500/10", 
        date: "New", 
        image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 8, 
        gameId: 'SNAKE', 
        title: t.snake?.title || "Snake", 
        status: t.events.active, 
        icon: <GitCommit className="text-blue-500" size={28} />, 
        color: "bg-blue-500/10", 
        date: "New", 
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 9, 
        gameId: 'SKY_STACK', 
        title: t.skyStack?.title || "Sky Stack", 
        status: t.events.active, 
        icon: <Layers className="text-yellow-500" size={28} />, 
        color: "bg-yellow-500/10", 
        date: "New", 
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 10, 
        gameId: 'MATCH3', 
        title: t.gameDetails?.MATCH3?.title || "Match 3", 
        status: t.events.active, 
        icon: <Sparkles className="text-purple-500" size={28} />, 
        color: "bg-purple-500/10", 
        date: "New", 
        image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 11, 
        gameId: 'COLOR_SORT', 
        title: t.colorSort?.title || "Color Sort", 
        status: t.events.active, 
        icon: <FlaskConical className="text-pink-500" size={28} />, 
        color: "bg-pink-500/10", 
        date: "New", 
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400" 
      },
      { 
        id: 12, 
        gameId: 'TETRIS', 
        title: t.gameDetails?.TETRIS?.title || "Tetris", 
        status: t.events.active, 
        icon: <Puzzle className="text-cyan-500" size={28} />, 
        color: "bg-cyan-500/10", 
        date: "New", 
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400" 
      }
    ];

    const activeGamesList = Object.values(gamesStats) as any[];
    
    let arenas = activeGamesList.map((stat, index) => {
        const staticTemplate = staticArenas.find(a => a.gameId === stat.id);
        return {
           id: index + 100, // Safe synthetic id
           gameId: stat.id,
           title: stat.displayName || staticTemplate?.title || stat.name || stat.id,
           status: t.events.active,
           icon: staticTemplate?.icon || <Gamepad2 className="text-[var(--primary)]" size={28} />,
           color: staticTemplate?.color || "bg-[var(--primary)]/10",
           date: staticTemplate?.date || "New",
           image: stat.imageUrl || staticTemplate?.image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400"
        };
    });

    if (arenas.length === 0) {
      arenas = staticArenas;
    }

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mb-0.5">{t.events.playerProfile}</p>
              <h2 className="text-xl font-extrabold tracking-tight">{user.name}</h2>
            </div>
          </div>
          <button 
            onClick={() => setScreen('PROFILE')} 
            className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden active:scale-90 transition-transform"
          >
            <UserIcon size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 no-scrollbar space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">{t.events.title}</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {arenas.filter(a => a.status !== t.events.comingSoon).map((arena) => (
              <motion.div
                key={arena.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (arena.status === t.events.active) {
                    setSelectedGameId(arena.gameId);
                    setScreen('EVENT_DETAILS');
                  }
                }}
                className="flex flex-col items-center gap-2.5 group cursor-pointer"
              >
                <div className={`relative aspect-[4/4.5] w-full rounded-[24px] overflow-hidden border transition-all duration-300 ${
                  arena.status === t.events.active 
                    ? 'border-[var(--primary)]/30 shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:shadow-lg' 
                    : 'border-white/5 opacity-40 grayscale'
                }`}>
                  <img 
                    src={arena.image} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  <div className="absolute inset-x-0 bottom-4 flex justify-center z-10 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className={`w-12 h-12 rounded-xl ${arena.color} flex items-center justify-center border border-white/10 backdrop-blur-md shadow-xl`}>
                      {React.cloneElement(arena.icon as React.ReactElement, { size: 24 })}
                    </div>
                  </div>

                  {arena.status === t.events.active && (
                    <div className="absolute top-3 right-3 z-20">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)] animate-pulse" />
                    </div>
                  )}
                </div>
                
                <div className="text-center px-1">
                  <h4 className="text-[13px] font-extrabold text-white/90 tracking-tight leading-tight">{arena.title}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const EventDetailsScreen = () => {
  const { setScreen, t, selectedGameId, prizes, gamesStats } = useGame();
  const [leaderboard, setLeaderboard] = useState<{rank: number, name: string, score: number}[]>([]);
  
  useEffect(() => {
    api.get(`/games/${selectedGameId}/leaderboard`)
       .then(r => setLeaderboard(r.data))
       .catch(e => console.error("Leaderboard fetch failed", e));
  }, [selectedGameId]);
  
  const gameBackgrounds: Record<string, string> = {
    ARENA_RUNNER: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
    NEON_JUMP: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    CYBER_SHIELD: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800",
    HIGHER_LOWER: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800",
    SNAKE: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
    SKY_STACK: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    MATCH3: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=800"
  };

  const stat = gamesStats[selectedGameId];
  const gameInfo = t.gameDetails[selectedGameId as keyof typeof t.gameDetails] || t.gameDetails.ARENA_RUNNER;
  let displayTitle = gameInfo.title;
  if (stat?.displayName) displayTitle = stat.displayName;
  const bgImage = stat?.imageUrl || gameBackgrounds[selectedGameId] || gameBackgrounds.ARENA_RUNNER;
  const gamePrizesCount = prizes.filter(p => p.gameId === selectedGameId).length;

  return (
    <ScreenWrapper>
      <div className="h-[45vh] relative">
        <img 
          src={bgImage} 
          alt="Event" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        <div className="absolute top-0 left-6 safe-top z-20">
          <BackButton onClick={() => setScreen('EVENTS')} />
        </div>
      </div>
      
      <div className="p-6 -mt-16 relative z-10 flex flex-col flex-1 bg-[var(--bg)] rounded-t-[48px] shadow-[0_-20px_40px_rgba(0,0,0,0.4)] safe-bottom">
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-4" />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--primary)]/30">
            {t.eventDetails.featured}
          </div>
        </div>
        
        <h2 className="text-2xl font-extrabold mb-2 tracking-tight">{displayTitle}</h2>
        <p className="text-[var(--text-muted)] text-sm mb-4 leading-snug font-medium">
          {gameInfo.desc}
        </p>

        <div className="grid grid-cols-1 mb-4">
          <div className="bg-[var(--surface)] p-3 rounded-[20px] border border-[var(--border)] text-center">
            <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] mb-0.5 tracking-widest">{t.eventDetails.totalPrizes}</p>
            <p className="text-lg font-extrabold text-[var(--primary)]">{gamePrizesCount} {t.eventDetails.prizesSuffix}</p>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold tracking-tight">{t.leaderboard.title}</h3>
            <Medal size={16} className="text-[var(--secondary)]" />
          </div>
          <div className="bg-[var(--surface)] rounded-[24px] border border-[var(--border)] overflow-hidden min-h-[100px]">
            {leaderboard.length > 0 ? leaderboard.map((player, i) => (
              <div key={i} className={`flex items-center justify-between p-2.5 ${i !== leaderboard.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-4 text-[10px] font-black ${player.rank === 1 ? 'text-[var(--secondary)]' : 'text-[var(--text-muted)]'}`}>
                    #{player.rank}
                  </span>
                  <span className="font-bold text-xs">{player.name}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[var(--primary)]">{player.score}</span>
              </div>
            )) : (
              <div className="flex items-center justify-center p-6 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {t.leaderboard?.empty || 'NO SCORES YET'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <Button 
            onClick={() => setScreen('SHOP')} 
            variant="secondary" 
            className="w-full py-4 text-lg rounded-[20px] border border-[var(--primary)]/30 text-[var(--primary)] font-extrabold flex items-center justify-center gap-2"
          >
            <Gift size={24} className="animate-pulse" />
            {t.shop?.prizeMarket || 'Prize Market'}
          </Button>
          <Button onClick={() => setScreen('GAME_BOARD')} className="w-full py-4 text-lg rounded-[20px] shadow-[0_0_30px_var(--primary-glow)]">
            {t.eventDetails.enterBoard}
          </Button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const MainGameScreen = () => {
  const { selectedGameId } = useGame();
  const GameComponent = Games[selectedGameId as GameId] || Games.ARENA_RUNNER;

  return (
    <ScreenWrapper>
      <GameComponent />
    </ScreenWrapper>
  );
};

export const PromoCodeScreen = () => {
  const { setScreen, addPoints, t } = useGame();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const activate = async () => {
    if (!code.trim()) return;
    
    try {
      const res = await api.post('/wallet/redeem-promo', { code });
      if (res.data && res.data.success) {
        addPoints(res.data.awarded); // Optimistic UI update for the newly added points
        setStatus('success');
        setTimeout(() => setScreen('GAME_BOARD'), 1500);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-12">
          <BackButton onClick={() => setScreen('PROFILE')} />
        </div>
        
        <div className="flex-1">
          <h2 className="text-4xl font-extrabold tracking-tight mb-3">{t.promo.title}</h2>
          <p className="text-[var(--text-muted)] text-lg mb-12 font-medium">{t.promo.desc}</p>

          <div className="space-y-6">
            <div className="relative">
              <input 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ARENA100"
                className={`w-full bg-[var(--surface)] border rounded-[24px] px-8 py-6 text-3xl font-black tracking-[0.2em] focus:outline-none transition-all uppercase ${
                  status === 'success' ? 'border-[var(--success)] text-[var(--success)] shadow-[0_0_20px_rgba(50,215,75,0.2)]' : 
                  status === 'error' ? 'border-[var(--danger)] text-[var(--danger)] animate-shake' : 
                  'border-[var(--border)] focus:border-[var(--primary)]'
                }`}
              />
              {status === 'success' && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--success)]"
                >
                  <CheckCircle2 size={32} />
                </motion.div>
              )}
            </div>


            <AnimatePresence>
              {status === 'success' && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-[var(--success)] font-bold text-lg">{t.promo.accepted}</motion.p>
              )}
              {status === 'error' && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-[var(--danger)] font-bold text-lg">{t.promo.invalid}</motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Button 
          onClick={activate} 
          disabled={code.length === 0 || status === 'success'}
          className="w-full py-5 text-xl rounded-[24px]"
        >
          {t.promo.activate}
        </Button>
      </div>
    </ScreenWrapper>
  );
};

export const ResultScreen = () => {
  const { setScreen, t, user } = useGame();
  
  return (
    <ScreenWrapper>
      <div className="p-8 safe-top safe-pb flex flex-col items-center min-h-full text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-[var(--primary)]/20 rounded-full flex items-center justify-center mb-4 border-4 border-[var(--primary)]/30"
        >
          <Trophy size={48} className="text-[var(--primary)]" />
        </motion.div>

        <h2 className="text-4xl font-black mb-2 tracking-tight">{t.result.congrats}</h2>
        <p className="text-[var(--text-muted)] text-lg mb-6 font-medium">
          {t.result.youWon} <span className="text-white font-bold">{user.highScore}</span> {t.result.prizes}
        </p>

        <div className="w-full bg-[var(--surface)] rounded-[32px] p-6 border border-[var(--border)] mb-6">
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2 tracking-widest">{t.result.yourPrize}</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <Medal size={24} className="text-[var(--secondary)]" />
            <span className="text-3xl font-black text-white">#12</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">{t.result.noPrizes}</p>
        </div>

        <div className="w-full space-y-4 mt-auto">
          <Button onClick={() => setScreen('GAME_BOARD')} className="w-full py-5 text-xl rounded-[24px]">
            {t.result.viewBoard}
          </Button>
          <button 
            onClick={() => setScreen('EVENTS')}
            className="w-full py-4 text-[var(--text-muted)] font-bold hover:text-white transition-colors"
          >
            {t.result.backEvents}
          </button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const PrizeScannerScreen = () => {
  const { setScreen, t } = useGame();
  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [qrData, setQrData] = useState('');
  const [claimInfo, setClaimInfo] = useState<any>(null);

  const handleScan = async (data: string) => {
    setIsScanning(false);
    try {
      const res = await api.post('/venue/scan', { qrCodeData: data });
      if (res.data && res.data.status === 'VALID') {
        setResult('success');
        setClaimInfo(res.data);
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    }
  };

  const handleRedeem = async () => {
    if (!claimInfo?.claimId) return;
    try {
      const res = await api.post('/venue/redeem', { claimId: claimInfo.claimId }, { headers: { 'idempotency-key': 'redeem_' + Date.now() }});
      if (res.data && res.data.status === 'REDEEMED') {
        alert('Prize Redeemed Successfully!');
        setScreen('VENUE_DASHBOARD');
      }
    } catch {
      alert('Failed to redeem prize');
    }
  };

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-8">
          <BackButton onClick={() => setScreen('VENUE_DASHBOARD')} />
          <h2 className="text-xl font-bold">Сканер QR-кодов</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {isScanning ? (
            <div className="relative w-full px-6">
              <div className="w-full aspect-square border-4 border-[var(--primary)] rounded-3xl relative overflow-hidden flex flex-col items-center justify-center bg-zinc-900">
                <Scan size={48} className="mb-4 text-[var(--primary)]" />
                <p className="font-bold text-[var(--primary)] opacity-70">Camera Feed Placeholder</p>
              </div>
              <div className="mt-8 relative z-50">
                <input 
                  type="text" 
                  value={qrData} onChange={e => setQrData(e.target.value)}
                  className="bg-black text-white px-4 py-4 rounded-xl w-full text-center font-bold text-xl border border-zinc-700"
                  placeholder="Ввести код вручную..."
                />
                <Button onClick={() => handleScan(qrData)} className="mt-4 w-full bg-[var(--primary)] text-zinc-950 py-4 text-lg font-bold">Симулировать Скан</Button>
              </div>
            </div>
          ) : result === 'success' ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full">
              <div className="w-24 h-24 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--success)]">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-black mb-2 text-[var(--success)]">QR-код валиден!</h3>
              <p className="text-[var(--text-muted)] mb-8">Приз можно выдавать.</p>
              
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8 text-left">
                <p className="text-sm text-[var(--text-muted)] mb-1">Приз</p>
                <p className="font-bold text-xl mb-4">{claimInfo?.prizeName}</p>

                <p className="text-sm text-[var(--text-muted)] mb-1">Игрок</p>
                <p className="font-bold text-xl mb-4">{claimInfo?.userName}</p>

                <p className="text-sm text-[var(--text-muted)] mb-1">Статус</p>
                <p className="font-bold text-xl text-[var(--success)]">Не выдан</p>
              </div>

              <div className="space-y-4">
                <Button onClick={handleRedeem} className="w-full py-4 text-lg font-bold bg-[var(--primary)] text-zinc-950">
                  Выдать приз
                </Button>
                <Button onClick={() => { setIsScanning(true); setResult('idle'); setQrData(''); }} className="w-full py-4 text-lg font-bold bg-[var(--surface)] text-white">
                  Сканировать следующий
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full">
              <div className="w-24 h-24 bg-[var(--danger)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--danger)]">
                <XCircle size={48} />
              </div>
              <h3 className="text-3xl font-black mb-2 text-[var(--danger)]">Ошибка</h3>
              <p className="text-[var(--text-muted)] mb-8">QR-код не найден, истек или принадлежит другой сети заведений.</p>
              <Button onClick={() => { setIsScanning(true); setResult('idle'); setQrData(''); }} className="w-full py-4 text-lg font-bold bg-[var(--primary)] text-zinc-950">
                Попробовать снова
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const VenueDashboard = () => {
  const { setScreen, user, t } = useGame();
  const [stats, setStats] = useState({ players: 0, prizes: 0, avgScore: 0, active: 0, pending: 0 });

  useEffect(() => {
    api.get('/venue/stats').then(res => {
      if (res.data) setStats(res.data);
    }).catch(e => console.error('Failed to load venue stats', e));
  }, []);

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => setScreen('PROFILE')} />
            <h2 className="text-2xl font-extrabold tracking-tight">Venue Dashboard</h2>
          </div>
          <div className="bg-[var(--arena-cyan)]/20 text-[var(--arena-cyan)] text-[10px] font-bold px-3 py-1 rounded-full border border-[var(--arena-cyan)]/30">
            {user.venueGameId || 'ARENA_RUNNER'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--surface)] p-5 rounded-[32px] border border-[var(--border)]">
            <Users size={20} className="text-[var(--arena-cyan)] mb-2" />
            <p className="text-2xl font-black">{stats.players.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Total Players</p>
          </div>
          <div className="bg-[var(--surface)] p-5 rounded-[32px] border border-[var(--border)]">
            <Gift size={20} className="text-[var(--secondary)] mb-2" />
            <p className="text-2xl font-black">{stats.prizes}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Prizes Issued</p>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] mb-8">
          <h3 className="text-lg font-bold mb-4">Game Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)] font-medium">Avg. Score</span>
              <span className="font-bold">{stats.avgScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)] font-medium">Daily Active</span>
              <span className="font-bold">{stats.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)] font-medium">Pending Prizes</span>
              <span className="font-bold text-[var(--secondary)]">{stats.pending}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => setScreen('PRIZE_SCANNER')}
          className="w-full py-6 rounded-[24px] flex items-center justify-center gap-3 text-xl bg-[var(--arena-cyan)] text-zinc-950"
        >
          <QrCode size={24} /> Scan Prize QR
        </Button>
      </div>
    </ScreenWrapper>
  );
};

export const AdminDashboard = () => {
  const { setScreen, prizes, setPrizes, t } = useGame();
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ARENA_RUNNER');
  const [editingPrize, setEditingPrize] = useState<any>(null);

  const games = [
    { id: 'ARENA_RUNNER', name: t.gameDetails.ARENA_RUNNER.title },
    { id: 'NEON_JUMP', name: t.gameDetails.NEON_JUMP.title },
    { id: 'CYBER_SHIELD', name: t.gameDetails.CYBER_SHIELD.title },
    { id: 'HIGHER_LOWER', name: t.gameDetails.HIGHER_LOWER.title },
    { id: 'SNAKE', name: t.gameDetails.SNAKE.title },
    { id: 'SKY_STACK', name: t.gameDetails.SKY_STACK.title },
    { id: 'MATCH3', name: t.gameDetails.MATCH3.title },
    { id: 'COLOR_SORT', name: t.gameDetails.COLOR_SORT.title },
    { id: 'TETRIS', name: t.gameDetails.TETRIS.title },
  ];

  const filteredPrizes = prizes.filter(p => p.gameId === selectedGameFilter);

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => setScreen('PROFILE')} />
            <h2 className="text-2xl font-extrabold tracking-tight">Admin Console</h2>
          </div>
          <Shield size={24} className="text-[var(--primary)]" />
        </div>

        {/* Game Selector Menu */}
        <div className="relative mb-6">
          <select
            value={selectedGameFilter}
            onChange={(e) => setSelectedGameFilter(e.target.value)}
            className="w-full p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-sm font-bold appearance-none pr-10"
          >
            {games.map(game => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[var(--text-muted)] text-xl opacity-80">▾</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">
              {games.find(g => g.id === selectedGameFilter)?.name} Prizes
            </h3>
            <button 
              onClick={() => {
                setEditingPrize({
                  isNew: true,
                  id: Math.random().toString(36).substr(2, 9),
                  gameId: selectedGameFilter,
                  name: '',
                  description: '',
                  pointsCost: 500,
                  image: '🎁',
                  available: true
                });
              }}
              className="text-[var(--primary)] text-sm font-bold"
            >
              + Add New
            </button>
          </div>

          {filteredPrizes.length === 0 ? (
            <div className="text-center py-12 bg-[var(--surface)] rounded-[32px] border border-dashed border-[var(--border)]">
              <p className="text-[var(--text-muted)] text-sm font-medium">No prizes for this game yet.</p>
              <button 
                onClick={() => {
                  setEditingPrize({
                    isNew: true,
                    id: Math.random().toString(36).substr(2, 9),
                    gameId: selectedGameFilter,
                    name: '',
                    description: '',
                    pointsCost: 500,
                    image: '🎁',
                    available: true
                  });
                }}
                className="mt-4 text-[var(--primary)] text-sm font-black uppercase tracking-widest"
              >
                Create First Prize
              </button>
            </div>
          ) : (
            filteredPrizes.map((prize) => (
              <div key={prize.id} className="bg-[var(--surface)] p-4 rounded-[24px] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{prize.image}</div>
                  <div>
                    <h4 className="font-bold text-sm">{prize.name}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">{prize.pointsCost} pts</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const newPrizes = prizes.map(p => p.id === prize.id ? { ...p, available: !p.available } : p);
                      setPrizes(newPrizes);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${prize.available ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--danger)]/20 text-[var(--danger)]'}`}
                  >
                    {prize.available ? 'Active' : 'Hidden'}
                  </button>
                  <button 
                    onClick={() => setEditingPrize(prize)}
                    className="p-2 text-[var(--text-muted)]"
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Delete this prize?')) {
                        setPrizes(prizes.filter(p => p.id !== prize.id));
                      }
                    }}
                    className="p-2 text-[var(--danger)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-[var(--surface)] p-5 rounded-[32px] border border-[var(--border)] text-center">
            <p className="text-2xl font-black">{prizes.length * 4120}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Total Users</p>
          </div>
          <div className="bg-[var(--surface)] p-5 rounded-[32px] border border-[var(--border)] text-center">
            <p className="text-2xl font-black"> {t.leaderboard.title === 'Лидеры' ? 'Ташкент' : 'Tashkent'} </p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Top Region</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editingPrize && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-0 bg-[#050505] z-50 p-6 safe-top safe-pb flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <BackButton onClick={() => setEditingPrize(null)} />
              <h3 className="text-xl font-bold">{editingPrize.isNew ? 'New Prize' : 'Edit Prize'}</h3>
              <div className="w-8" />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
              <div className="flex flex-col items-center mb-6">
                <input 
                  type="text" 
                  value={editingPrize.image} 
                  onChange={(e) => setEditingPrize({...editingPrize, image: e.target.value})}
                  className="w-24 h-24 text-5xl text-center bg-[var(--surface)] border-2 border-[var(--primary)]/30 rounded-3xl focus:outline-none focus:border-[var(--primary)] mb-2"
                  placeholder="🎁"
                />
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Emoji / Icon</span>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] ml-2 mb-1 block">Prize Name</label>
                <input 
                  type="text" 
                  value={editingPrize.name} 
                  onChange={(e) => setEditingPrize({...editingPrize, name: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-base font-bold"
                  placeholder="e.g. Free Coffee"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] ml-2 mb-1 block">Description</label>
                <textarea 
                  value={editingPrize.description} 
                  onChange={(e) => setEditingPrize({...editingPrize, description: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-sm font-medium h-24 resize-none"
                  placeholder="Enter details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] ml-2 mb-1 block">Points Cost</label>
                  <input 
                    type="number" 
                    value={editingPrize.pointsCost} 
                    onChange={(e) => setEditingPrize({...editingPrize, pointsCost: parseInt(e.target.value) || 0})}
                    className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-base font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] ml-2 mb-1 block">Game Filter</label>
                  <select
                    value={editingPrize.gameId}
                    onChange={(e) => setEditingPrize({...editingPrize, gameId: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-xs font-bold appearance-none"
                  >
                    {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Button 
                onClick={() => {
                  if (!editingPrize.name) return alert('Name required');
                  if (editingPrize.isNew) {
                    const { isNew, ...prizeToSave } = editingPrize;
                    setPrizes([...prizes, prizeToSave]);
                  } else {
                    setPrizes(prizes.map(p => p.id === editingPrize.id ? editingPrize : p));
                  }
                  setEditingPrize(null);
                }}
                className="w-full py-5 text-lg rounded-[24px]"
              >
                Save Prize
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenWrapper>
  );
};

export const LeaderboardScreen = () => {
  const { setScreen, user, t } = useGame();
  const [tab, setTab] = useState<'GLOBAL' | 'FRIENDS'>('GLOBAL');
  const [timeTab, setTimeTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/games/leaderboards/global').then(res => {
      if (res.data) {
        // Find local user in the list to highlight
        const mapped = res.data.map((p: any) => ({
          ...p,
          avatar: "🎮", // default avatar since we don't have user avatars
          isUser: p.name === user.name || p.name === `User ${user.phone?.slice(-4) || ''}`
        }));
        setPlayers(mapped);
      }
    }).catch(e => console.error(e));
  }, [user]);

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => setScreen('EVENTS')} />
            <h2 className="text-2xl font-extrabold tracking-tight">{t.leaderboard.title}</h2>
          </div>
          <Medal size={24} className="text-[var(--secondary)]" />
        </div>

        <div className="flex bg-[var(--surface)] p-1 rounded-full mb-4 border border-[var(--border)]">
          <button 
            onClick={() => setTab('GLOBAL')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${tab === 'GLOBAL' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)]'}`}
          >
            Global
          </button>
          <button 
            onClick={() => setTab('FRIENDS')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${tab === 'FRIENDS' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)]'}`}
          >
            Friends
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {['DAILY', 'WEEKLY', 'MONTHLY'].map(t => (
            <button 
              key={t}
              onClick={() => setTimeTab(t as any)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${timeTab === t ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-green-500">Great job!</p>
            <p className="text-xs text-green-500/80">You overtook 124 people today!</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-6">
          {players.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-[24px] border ${
                player.isUser 
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 shadow-[0_0_15px_rgba(10,132,255,0.1)]' 
                  : 'bg-[var(--surface)] border-[var(--border)]'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-6 text-sm font-black ${
                  player.rank === 1 ? 'text-[var(--secondary)]' : 
                  player.rank === 2 ? 'text-zinc-400' : 
                  player.rank === 3 ? 'text-orange-400' : 'text-[var(--text-muted)]'
                }`}>
                  #{player.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-xl border border-[var(--border)]">
                  {player.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{player.name}</h4>
                  {player.isUser && <span className="text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">You</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-black text-[var(--primary)]">{player.score}</p>
                <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Points</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScreenWrapper>
  );
};



export const ShopScreen = () => {
  const { setScreen } = useGame();

  return (
    <ScreenWrapper>
      <ShopContent onBack={() => setScreen('EVENT_DETAILS')} />
    </ScreenWrapper>
  );
};

export const ProfileScreen = () => {
  const { setScreen, user, setUser, t, logout } = useGame();
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = () => {
    api.get('/wallet/history').then(res => setHistory(res.data)).catch(e => console.error(e));
  };

  const handleAdminAuth = () => {
    if (adminPass === '1553688') {
      window.location.href = window.location.protocol + '//' + window.location.hostname + ':8081';
    } else {
      setAdminError('Неверный пароль доступа');
    }
  };

  const setRole = (role: UserRole) => {
    setUser({ ...user, role });
  };

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => setScreen('EVENTS')} />
            <h2 className="text-2xl font-extrabold tracking-tight">{t.profile.title}</h2>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 relative mb-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-[var(--primary)]/30 rounded-full" 
            />
            <div className="absolute inset-4 bg-[var(--primary)]/10 blur-2xl rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Logo className="w-16 h-16 text-[var(--primary)] relative z-10 drop-shadow-2xl" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-[var(--surface)] rounded-full border-4 border-[var(--bg)] flex items-center justify-center z-20 shadow-xl">
              <div className={`w-full h-full rounded-full flex items-center justify-center ${
                user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-[var(--secondary)]' : 
                user.role === 'VENUE' ? 'bg-[var(--arena-cyan)]' : 'bg-[var(--primary)]'
              }`}>
                {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? <Shield size={16} className="text-white" /> : 
                 user.role === 'VENUE' ? <Grid size={16} className="text-white" /> : 
                 <UserIcon size={16} className="text-white" />}
              </div>
            </div>
          </div>
          <h3 className="text-3xl font-black tracking-tight mb-1">{user.name}</h3>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-[var(--secondary)]/10 border-[var(--secondary)]/30 text-[var(--secondary)]' : 
              user.role === 'VENUE' ? 'bg-[var(--arena-cyan)]/10 border-[var(--arena-cyan)]/30 text-[var(--arena-cyan)]' : 
              'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
            }`}>
              {user.role} {t.profile.account}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {/* Role Specific Sections */}
          {user.role === 'USER' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] relative overflow-hidden shadow-sm">
                  <Trophy size={20} className="text-[var(--primary)] mb-3" />
                  <p className="text-3xl font-black tracking-tight">{user.highScore}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Best Score</p>
                </div>
                <div className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] relative overflow-hidden shadow-sm">
                  <Ticket size={20} className="text-[var(--secondary)] mb-3" />
                  <p className="text-3xl font-black tracking-tight">{user.points}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{t.profile.points}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setScreen('SHOP')}
                  className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} className="text-[var(--secondary)]" />
                    <span className="text-lg font-bold">{t.profile.prizesShop}</span>
                  </div>
                  <ChevronRight size={22} className="text-[var(--text-muted)]" />
                </button>
                <button 
                  onClick={() => setScreen('LEADERBOARD')}
                  className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <Trophy size={20} className="text-[var(--primary)]" />
                    <span className="text-lg font-bold">{t.profile.leaderboards}</span>
                  </div>
                  <ChevronRight size={22} className="text-[var(--text-muted)]" />
                </button>
                <button 
                  onClick={() => { fetchHistory(); setShowHistoryModal(true); }}
                  className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <History size={20} className="text-[var(--primary)]" />
                    <span className="text-lg font-bold">Transaction History</span>
                  </div>
                  <ChevronRight size={22} className="text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
          )}

          {user.role === 'VENUE' && (
            <div className="space-y-4">
              <div className="bg-[var(--arena-cyan)]/10 border border-[var(--arena-cyan)]/30 rounded-[32px] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Grid size={24} className="text-[var(--arena-cyan)]" />
                  <h4 className="text-xl font-black text-[var(--arena-cyan)]">{t.profile.venueControls}</h4>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-6 font-medium leading-relaxed">
                  {t.profile.venueDesc}
                </p>
                <button 
                  onClick={() => setScreen('VENUE_DASHBOARD')}
                  className="w-full py-4 bg-[var(--arena-cyan)] text-zinc-950 font-black rounded-2xl shadow-[0_10px_20px_rgba(0,255,255,0.2)] active:scale-[0.98] transition-transform"
                >
                  {t.profile.openDashboard}
                </button>
              </div>
              
              <div className="bg-[var(--surface)] p-5 rounded-[24px] border border-[var(--border)] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <QrCode size={20} className="text-[var(--text-muted)]" />
                  <span className="font-bold">{t.profile.quickScan}</span>
                </div>
                <button onClick={() => setScreen('PRIZE_SCANNER')} className="text-[var(--arena-cyan)] font-black text-xs uppercase tracking-widest">{t.profile.launch}</button>
              </div>
            </div>
          )}

          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <div className="space-y-4">
              <div className="bg-[var(--secondary)]/10 border border-[var(--secondary)]/30 rounded-[32px] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={24} className="text-[var(--secondary)]" />
                  <h4 className="text-xl font-black text-[var(--secondary)]">{t.profile.adminConsole}</h4>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-6 font-medium leading-relaxed">
                  {t.profile.adminDesc}
                </p>
                <button 
                  onClick={() => setShowAdminPrompt(true)}
                  className="w-full py-4 bg-[var(--secondary)] text-zinc-950 font-black rounded-2xl shadow-[0_10px_20px_rgba(255,100,0,0.2)] active:scale-[0.98] transition-transform"
                >
                  {t.profile.enterAdmin}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--surface)] p-4 rounded-[24px] border border-[var(--border)]">
                  <p className="text-lg font-black">12.5k</p>
                  <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Users</p>
                </div>
                <div className="bg-[var(--surface)] p-4 rounded-[24px] border border-[var(--border)]">
                  <p className="text-lg font-black">84%</p>
                  <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Retention</p>
                </div>
              </div>
            </div>
          )}

          {/* Common Settings */}
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => setScreen('SETTINGS')}
              className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform"
            >
              <span className="text-lg font-bold">{t.profile.settings}</span>
              <ChevronRight size={22} className="text-[var(--text-muted)]" />
            </button>
            <button 
              onClick={() => {
                logout();
                setScreen('WELCOME');
              }}
              className="w-full p-6 text-[var(--text-muted)] hover:text-white font-black text-lg text-center active:scale-[0.98] transition-all"
            >
              {t.profile.logout}
            </button>
            
            <button 
              onClick={async () => {
                const confirmed = window.confirm('Вы уверены, что хотите НАВСЕГДА удалить свой аккаунт? Все ваши очки и достижения будут стерты, а вы не сможете зарегистрироваться на этот номер в течение 1 месяца!');
                if (confirmed) {
                  try {
                    await api.delete('/auth/me');
                    alert('Ваш аккаунт был успешно удален.');
                    logout();
                    setScreen('WELCOME');
                  } catch (e: any) {
                    alert(e.response?.data?.message || 'Ошибка удаления аккаунта');
                  }
                }
              }}
              className="w-full mt-4 p-4 text-[var(--danger)]/80 hover:text-[var(--danger)] bg-[var(--danger)]/5 border border-[var(--danger)]/20 rounded-[24px] font-black text-sm uppercase tracking-widest text-center active:scale-[0.98] transition-all"
            >
              Удалить аккаунт
            </button>
          </div>
        </div>

        {/* History Modal */}
        <AnimatePresence>
          {showHistoryModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-[var(--bg)] sm:rounded-[32px] rounded-t-[32px] p-6 max-h-[80vh] flex flex-col border border-[var(--border)] shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black">Transaction History</h3>
                  <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-[var(--surface)] rounded-full active:scale-95">
                    <XCircle size={24} className="text-[var(--text)]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                  {history.length === 0 ? (
                    <div className="text-center p-8 text-[var(--text-muted)]">
                      <History size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    history.map(tx => (
                      <div key={tx.id} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{tx.referenceType === 'PROMO' ? 'Promo Code' : tx.referenceType === 'GAME_SESSION' ? 'Game Reward' : tx.type}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-black font-mono ${Number(tx.amount) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Number(tx.amount) > 0 ? '+' : ''}{tx.amount}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showAdminPrompt && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--bg)] p-6 rounded-[32px] w-full max-w-sm border border-[var(--border)] shadow-2xl">
              <h3 className="text-xl font-black mb-2 tracking-tight flex items-center gap-2">
                <Shield size={20} className="text-[var(--secondary)]" /> 
                Переход в Админ-Панель
              </h3>
              <p className="text-[var(--text-muted)] text-sm font-medium mb-6">Введите универсальный пароль администратора.</p>
              
              <input 
                type="password" 
                value={adminPass}
                onChange={(e) => { setAdminPass(e.target.value); setAdminError(''); }}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/30 transition-all font-mono text-center tracking-widest text-lg mb-2"
                placeholder="•••••••"
                autoFocus
              />
              {adminError && <p className="text-[var(--danger)] text-sm text-center mb-4 font-bold">{adminError}</p>}
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setShowAdminPrompt(false); setAdminPass(''); setAdminError(''); }}
                  className="flex-1 py-3.5 bg-[var(--surface)] text-white font-bold rounded-2xl active:scale-95 transition-transform"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleAdminAuth}
                  className="flex-1 py-3.5 bg-[var(--secondary)] text-black font-extrabold rounded-2xl active:scale-95 transition-transform"
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
};

export const SettingsScreen = () => {
  const { setScreen, t } = useGame();
  const [notifs, setNotifs] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);

  const SettingItem = ({ icon: Icon, label, value, onToggle }: any) => (
    <div className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center border border-[var(--border)]">
          <Icon size={20} className="text-[var(--primary)]" />
        </div>
        <span className="text-lg font-bold">{label}</span>
      </div>
      <button 
        onClick={() => onToggle(!value)}
        className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-[var(--primary)]' : 'bg-zinc-800'}`}
      >
        <motion.div 
          animate={{ x: value ? 26 : 2 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={() => setScreen('PROFILE')} />
          <h2 className="text-2xl font-extrabold tracking-tight">{t.settings.title}</h2>
        </div>

        <div className="space-y-3 flex-1">
          <SettingItem 
            icon={Bell} 
            label={t.settings.notifications} 
            value={notifs} 
            onToggle={setNotifs} 
          />
          <SettingItem 
            icon={Volume2} 
            label={t.settings.sound} 
            value={sound} 
            onToggle={setSound} 
          />
          <SettingItem 
            icon={Vibrate} 
            label={t.settings.vibration} 
            value={vibration} 
            onToggle={setVibration} 
          />
          
          <div className="pt-4 space-y-3">
            <button className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center border border-[var(--border)]">
                  <Lock size={20} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-lg font-bold">{t.settings.privacy}</span>
              </div>
              <ExternalLink size={18} className="text-[var(--text-muted)]" />
            </button>
            <button className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center border border-[var(--border)]">
                  <FileText size={20} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-lg font-bold">{t.settings.terms}</span>
              </div>
              <ExternalLink size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em]">{t.settings.version}</p>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const SupportScreen = () => {
  const { setScreen, t } = useGame();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const faqs = [
    { q: "How to earn points?", a: "Play mini-games in various arenas. Each game has its own scoring system." },
    { q: "Where can I spend points?", a: "Visit the Shop to redeem your points for exclusive prizes." },
    { q: "How to enter an arena?", a: "Select an active arena from the main menu to start playing." }
  ];

  const handleSend = () => {
    if (message.trim()) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setMessage('');
      }, 3000);
    }
  };

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={() => setScreen('PROFILE')} />
          <h2 className="text-2xl font-extrabold tracking-tight">{t.support.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-6">
          {/* FAQ Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 ml-2">{t.support.faq}</h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-[var(--surface)] p-5 rounded-[24px] border border-[var(--border)]">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <HelpCircle size={14} className="text-[var(--primary)]" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 ml-2">{t.support.contact}</h3>
            <div className="space-y-3">
              <button className="w-full p-5 bg-[#229ED9]/10 rounded-[24px] border border-[#229ED9]/20 flex justify-between items-center active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center">
                    <Send size={18} className="text-white" />
                  </div>
                  <span className="font-bold text-[#229ED9]">{t.support.telegram}</span>
                </div>
                <ChevronRight size={18} className="text-[#229ED9]" />
              </button>
              
              <div className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)]">
                <h4 className="font-bold text-sm mb-4">{t.support.message}</h4>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.support.placeholder}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[20px] p-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-all min-h-[120px] resize-none mb-4"
                />
                <Button 
                  onClick={handleSend}
                  disabled={!message.trim() || sent}
                  className="w-full py-4 rounded-[20px] flex items-center justify-center gap-2"
                >
                  {sent ? (
                    <>
                      <CheckCircle2 size={18} />
                      {t.support.success}
                    </>
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      {t.support.send}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ScreenWrapper>
  );
};
