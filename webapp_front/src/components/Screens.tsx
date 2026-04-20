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
  Copy,
  Pencil,
  History,
  Upload,
  Image as ImageIcon
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
        setError(t.errors?.invalidPhone || 'Неверный формат номера');
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
        setError(t.errors?.invalidCodeLength || 'Код должен состоять из 6 цифр');
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
          <BackButton />
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

    let arenas = Object.keys(t.gameDetails).map(gameId => {
      const stat = gamesStats[gameId];
      const staticTemplate = staticArenas.find(a => a.gameId === gameId);
      
      return {
        id: gameId,
        title: stat?.displayName || staticTemplate?.title || gameId,
        color: staticTemplate?.color || 'bg-violet-500/20',
        icon: staticTemplate?.icon || <Gamepad2 size={24} className="text-violet-400" />,
        image: stat?.imageUrl || staticTemplate?.image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400",
        gameId: gameId,
        status: stat?.isActive !== false ? t.events.active : 'Скоро',
        isActive: stat?.isActive !== false,
        venueNetworkName: stat?.venueNetworkName || null
      };
    });

    arenas.sort((a, b) => {
      const aHasVenue = a.venueNetworkName ? 1 : 0;
      const bHasVenue = b.venueNetworkName ? 1 : 0;
      if (aHasVenue !== bHasVenue) return bHasVenue - aHasVenue;
      
      const aActive = a.isActive ? 1 : 0;
      const bActive = b.isActive ? 1 : 0;
      return bActive - aActive;
    });

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

          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {arenas.map((arena) => (
              <motion.div
                key={arena.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (arena.isActive) {
                    setSelectedGameId(arena.gameId);
                    setScreen('EVENT_DETAILS');
                  }
                }}
                className="flex flex-col items-center gap-2.5 group cursor-pointer"
              >
                <div className={`p-4 rounded-3xl mb-4 relative aspect-[4/3] w-full flex items-center justify-center bg-zinc-900 group-hover:scale-[1.02] transition-transform overflow-hidden ${arena.isActive ? '' : 'opacity-60 saturate-0'}`}>
                  <img 
                    src={arena.image} 
                    alt={arena.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-transparent rounded-3xl" />
                  
                  {!arena.isActive && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 rounded-3xl">
                      <span className="text-white font-bold tracking-widest text-lg uppercase bg-gradient-to-r from-red-600 to-red-500 px-5 py-2 rounded-2xl shadow-lg border border-red-400/30">Скоро</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-x-0 bottom-4 flex justify-center z-10 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className={`w-12 h-12 rounded-xl ${arena.color} flex items-center justify-center border border-white/10 backdrop-blur-md shadow-xl`}>
                      {React.cloneElement(arena.icon as React.ReactElement, { size: 24 })}
                    </div>
                  </div>

                  {arena.isActive && (
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
          <BackButton />
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
          <BackButton />
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
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [qrData, setQrData] = useState('');
  const [claimInfo, setClaimInfo] = useState<any>(null);

  const handleScan = async (data: string) => {
    if (!data.trim()) return;
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

  const resetForm = () => {
    setResult('idle');
    setQrData('');
    setClaimInfo(null);
  };

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-12">
          <BackButton />
          <h2 className="text-xl font-bold">{t.qrScanner?.scannerTitle || 'Выдача Призов'}</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {result === 'idle' ? (
            <div className="w-full max-w-sm">
              <div className="bg-[var(--surface)] p-8 rounded-[32px] border border-[var(--border)] shadow-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mb-6">
                  <Gift size={40} />
                </div>
                <h3 className="text-2xl font-black mb-2">Введите код приза</h3>
                <p className="text-[var(--text-muted)] text-sm mb-8">
                  Попросите гостя продиктовать уникальный 8-значный код из раздела "Мои Призы"
                </p>
                <input 
                  type="text" 
                  value={qrData} onChange={e => setQrData(e.target.value.toUpperCase())}
                  className="bg-[var(--bg)] text-white px-6 py-5 rounded-2xl w-full text-center font-mono tracking-[0.3em] font-black text-2xl border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all uppercase mb-6 shadow-inner"
                  placeholder="EX: A1B2C3D4"
                />
                <Button 
                  onClick={() => handleScan(qrData)} 
                  disabled={qrData.length < 5}
                  className="w-full bg-[var(--primary)] text-zinc-950 py-4 text-lg font-bold rounded-2xl disabled:opacity-50"
                >
                  {t.qrScanner?.simulateScan || 'Проверить код'}
                </Button>
              </div>
            </div>
          ) : result === 'success' ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full">
              <div className="w-24 h-24 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--success)]">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-black mb-2 text-[var(--success)]">{t.qrScanner?.validWait || 'QR-код валиден!'}</h3>
              <p className="text-[var(--text-muted)] mb-8">{t.qrScanner?.validDesc || 'Приз можно выдавать.'}</p>
              
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8 text-left">
                <p className="text-sm text-[var(--text-muted)] mb-1">{t.qrScanner?.prizeLabel || 'Приз'}</p>
                <p className="font-bold text-xl mb-4">{claimInfo?.prizeName}</p>

                <p className="text-sm text-[var(--text-muted)] mb-1">{t.qrScanner?.playerLabel || 'Игрок'}</p>
                <p className="font-bold text-xl mb-4">{claimInfo?.userName}</p>

                <p className="text-sm text-[var(--text-muted)] mb-1">{t.qrScanner?.statusLabel || 'Статус'}</p>
                <p className="font-bold text-xl text-[var(--success)]">{t.qrScanner?.notIssued || 'Не выдан'}</p>
              </div>

              <div className="space-y-4">
                <Button onClick={handleRedeem} className="w-full py-4 text-lg font-bold bg-[var(--primary)] text-zinc-950">
                  {t.qrScanner?.issuePrize || 'Выдать приз'}
                </Button>
                <Button onClick={() => { resetForm(); }} className="w-full py-4 text-lg font-bold bg-[var(--surface)] text-white">
                  Ввести следующий код
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full max-w-sm bg-[var(--surface)] p-8 border border-[var(--border)] rounded-[32px] shadow-2xl mx-auto">
              <div className="w-24 h-24 bg-[var(--danger)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--danger)]">
                <XCircle size={48} />
              </div>
              <h3 className="text-3xl font-black mb-2 text-[var(--danger)]">{t.qrScanner?.invalidQr || 'Ошибка'}</h3>
              <p className="text-[var(--text-muted)] mb-8">{t.qrScanner?.invalidDesc || 'Код не найден, истек или принадлежит другой сети заведений.'}</p>
              <Button onClick={() => { resetForm(); }} className="w-full py-4 text-lg font-bold bg-[var(--danger)] text-white rounded-2xl">
                {t.qrScanner?.retry || 'Попробовать снова'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );
};

export const VenueDashboard = () => {
  const { setScreen, t } = useGame();
  const [summary, setSummary] = useState({ players: 0, prizes: 0, avgScore: 0, active: 0, pending: 0 });
  const [detailed, setDetailed] = useState<{ venueName: string | null; games: any[] }>({ venueName: null, games: [] });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const vd = t.venueDashboard;

  useEffect(() => {
    Promise.all([
      api.get('/venue/stats').then(r => r.data).catch(() => null),
      api.get('/venue/detailed-stats').then(r => r.data).catch(() => null),
    ]).then(([s, d]) => {
      if (s) setSummary(s);
      if (d) setDetailed(d);
      setLoading(false);
    });
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}${vd?.hoursLabel || 'h'} ${m}${vd?.minutesLabel || 'm'}`;
    return `${m}${vd?.minutesLabel || 'm'}`;
  };

  const selectedGame = detailed.games[selectedIdx] ?? null;

  const gameColors = [
    { accent: '#0a84ff', bg: 'rgba(10,132,255,0.15)', border: 'rgba(10,132,255,0.3)' },
    { accent: '#30d158', bg: 'rgba(48,209,88,0.15)', border: 'rgba(48,209,88,0.3)' },
    { accent: '#ff9f0a', bg: 'rgba(255,159,10,0.15)', border: 'rgba(255,159,10,0.3)' },
    { accent: '#bf5af2', bg: 'rgba(191,90,242,0.15)', border: 'rgba(191,90,242,0.3)' },
    { accent: '#ff375f', bg: 'rgba(255,55,95,0.15)', border: 'rgba(255,55,95,0.3)' },
    { accent: '#64d2ff', bg: 'rgba(100,210,255,0.15)', border: 'rgba(100,210,255,0.3)' },
  ];

  const getColor = (idx: number) => gameColors[idx % gameColors.length];

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-full safe-top safe-pb overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest leading-none mb-0.5">
                {detailed.venueName || 'Venue'}
              </p>
              <h2 className="text-xl font-extrabold tracking-tight leading-tight">{vd?.title || 'Dashboard'}</h2>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[var(--arena-cyan)]/20 flex items-center justify-center border border-[var(--arena-cyan)]/30">
            <Layers size={18} className="text-[var(--arena-cyan)]" />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <>
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-3 px-6 mb-5">
              {[
                { icon: <Users size={16} />, value: summary.players, label: vd?.totalPlayers || 'Players', color: '#0a84ff' },
                { icon: <Gift size={16} />, value: summary.pending, label: vd?.pendingPrizes || 'Pending', color: '#ff9f0a' },
                { icon: <CheckCircle2 size={16} />, value: summary.prizes - summary.pending, label: vd?.redeemedPrizes || 'Redeemed', color: '#30d158' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-[var(--surface)] rounded-[20px] border border-[var(--border)] p-3.5 text-center"
                >
                  <div className="flex justify-center mb-1.5" style={{ color: item.color }}>{item.icon}</div>
                  <p className="text-lg font-black leading-none">{item.value.toLocaleString()}</p>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider mt-1 leading-tight">{item.label}</p>
                </motion.div>
              ))}
            </div>

            {detailed.games.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                  <Gamepad2 size={32} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-muted)] font-bold">{vd?.noData || 'No activity yet'}</p>
              </div>
            ) : (
              <>
                {/* Game Selector Tabs */}
                {detailed.games.length > 1 && (
                  <div className="px-6 mb-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mb-2">{vd?.selectGame || 'Select Game'}</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {detailed.games.map((game, idx) => {
                        const col = getColor(idx);
                        const isSelected = selectedIdx === idx;
                        return (
                          <motion.button
                            key={game.gameId}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedIdx(idx)}
                            className="flex-shrink-0 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all duration-200"
                            style={{
                              background: isSelected ? col.bg : 'var(--surface)',
                              borderColor: isSelected ? col.accent : 'var(--border)',
                              color: isSelected ? col.accent : 'var(--text-muted)',
                            }}
                          >
                            {game.gameName}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Game Stats */}
                {selectedGame && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGame.gameId}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                      className="px-6 space-y-4 pb-4"
                    >
                      {/* Game Header */}
                      <div
                        className="rounded-[28px] overflow-hidden border relative"
                        style={{ borderColor: getColor(selectedIdx).border }}
                      >
                        {selectedGame.imageUrl && (
                          <img
                            src={selectedGame.imageUrl}
                            alt={selectedGame.gameName}
                            className="absolute inset-0 w-full h-full object-cover opacity-20"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div
                          className="relative p-5"
                          style={{ background: getColor(selectedIdx).bg }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-black tracking-tight" style={{ color: getColor(selectedIdx).accent }}>
                              {selectedGame.gameName}
                            </h3>
                            <div
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                              style={{
                                background: selectedGame.isActive ? 'rgba(48,209,88,0.15)' : 'rgba(255,55,95,0.1)',
                                borderColor: selectedGame.isActive ? 'rgba(48,209,88,0.4)' : 'rgba(255,55,95,0.4)',
                                color: selectedGame.isActive ? '#30d158' : '#ff375f',
                              }}
                            >
                              {selectedGame.isActive ? '● LIVE' : '○ OFF'}
                            </div>
                          </div>

                          {/* 4-stat grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { icon: <Users size={14}/>, label: vd?.totalPlayers || 'Players', value: selectedGame.playersCount },
                              { icon: <Clock size={14}/>, label: vd?.sessions || 'Sessions', value: selectedGame.totalSessions },
                              { icon: <Zap size={14}/>, label: vd?.todayPlayers || 'Today', value: selectedGame.todaySessions },
                              { icon: <Trophy size={14}/>, label: vd?.maxScore || 'Best Score', value: selectedGame.maxScore.toLocaleString() },
                            ].map((s, i) => (
                              <div key={i} className="bg-black/20 backdrop-blur-sm rounded-[16px] p-3 border border-white/5">
                                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: getColor(selectedIdx).accent }}>
                                  {s.icon}
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-white/50">{s.label}</span>
                                </div>
                                <p className="text-xl font-black text-white leading-none">{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Extended Stats Row */}
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          {
                            label: vd?.totalTime || 'Playtime',
                            value: formatTime(selectedGame.totalTimePlayedSec),
                            icon: <History size={14} />,
                            color: '#bf5af2'
                          },
                          {
                            label: vd?.avgScore || 'Avg Score',
                            value: selectedGame.avgScore.toLocaleString(),
                            icon: <Flame size={14} />,
                            color: '#ff9f0a'
                          },
                          {
                            label: vd?.pointsAwarded || 'Points',
                            value: selectedGame.totalPointsAwarded > 999
                              ? `${(selectedGame.totalPointsAwarded / 1000).toFixed(1)}K`
                              : String(selectedGame.totalPointsAwarded),
                            icon: <Sparkles size={14} />,
                            color: '#30d158'
                          },
                        ].map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                            className="bg-[var(--surface)] rounded-[18px] border border-[var(--border)] p-3"
                          >
                            <div className="mb-2" style={{ color: s.color }}>{s.icon}</div>
                            <p className="text-base font-black leading-tight">{s.value}</p>
                            <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-wider mt-1">{s.label}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Prize Stats */}
                      <div className="bg-[var(--surface)] rounded-[24px] border border-[var(--border)] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Gift size={16} className="text-[var(--secondary)]" />
                          <h4 className="text-sm font-bold">{vd?.prizesIssued || 'Prizes'}</h4>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 text-center p-3 rounded-[14px] bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xl font-black text-orange-400">{selectedGame.pendingPrizes}</p>
                            <p className="text-[9px] text-orange-300/70 uppercase font-bold tracking-wider mt-0.5">{vd?.pendingPrizes || 'Pending'}</p>
                          </div>
                          <div className="flex-1 text-center p-3 rounded-[14px] bg-green-500/10 border border-green-500/20">
                            <p className="text-xl font-black text-green-400">{selectedGame.redeemedPrizes}</p>
                            <p className="text-[9px] text-green-300/70 uppercase font-bold tracking-wider mt-0.5">{vd?.redeemedPrizes || 'Redeemed'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Top Players */}
                      <div className="bg-[var(--surface)] rounded-[24px] border border-[var(--border)] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <Medal size={16} className="text-[var(--secondary)]" />
                            <h4 className="text-sm font-bold">{vd?.topPlayers || 'Top Players'}</h4>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-bold">{selectedGame.topPlayers?.length ?? 0}</span>
                        </div>

                        {!selectedGame.topPlayers?.length ? (
                          <div className="flex items-center justify-center py-8 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            {vd?.noData || 'No activity yet'}
                          </div>
                        ) : (
                          <div>
                            {/* Header Row */}
                            <div className="grid grid-cols-[24px_1fr_60px_50px] gap-2 px-4 py-2 text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider border-b border-[var(--border)]/50">
                              <span>#</span>
                              <span>Player</span>
                              <span className="text-right">Score</span>
                              <span className="text-right">Time</span>
                            </div>
                            {selectedGame.topPlayers.map((player: any, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`grid grid-cols-[24px_1fr_60px_50px] gap-2 items-center px-4 py-3 ${i !== selectedGame.topPlayers.length - 1 ? 'border-b border-[var(--border)]/40' : ''}`}
                              >
                                <span
                                  className={`text-[11px] font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-[var(--text-muted)]'}`}
                                >
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                </span>
                                <div>
                                  <p className="text-xs font-bold text-white truncate">{player.name}</p>
                                  <p className="text-[9px] text-[var(--text-muted)]">{player.sessions} {vd?.sessions?.toLowerCase() || 'sessions'}</p>
                                </div>
                                <p className="text-xs font-black text-right" style={{ color: getColor(selectedIdx).accent }}>
                                  {player.bestScore.toLocaleString()}
                                </p>
                                <p className="text-[10px] font-bold text-right text-[var(--text-muted)]">
                                  {formatTime(player.totalTimeSec)}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </>
            )}
          </>
        )}

        {/* Scan Button */}
        <div className="px-6 pt-2 pb-6 mt-auto">
          <Button
            onClick={() => setScreen('PRIZE_SCANNER')}
            className="w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-base font-extrabold bg-[var(--arena-cyan)] text-zinc-950"
          >
            <QrCode size={22} /> {vd?.scanPrize || 'Scan Prize QR'}
          </Button>
        </div>
      </div>
    </ScreenWrapper>
  );
};


export const AdminDashboard = () => {
  const { setScreen, prizes, setPrizes, t } = useGame();
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ARENA_RUNNER');
  const [editingPrize, setEditingPrize] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>({ totalUsers: 0, topRegion: '...' });

  useEffect(() => {
    api.get('/admin/stats').then(res => {
      if (res.data) setAdminStats(res.data);
    }).catch(console.error);
  }, []);

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
            <BackButton />
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
            <p className="text-2xl font-black">{adminStats.totalUsers}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Total Users</p>
          </div>
          <div className="bg-[var(--surface)] p-5 rounded-[32px] border border-[var(--border)] text-center">
            <p className="text-2xl font-black">{adminStats.topRegion}</p>
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
  const { setScreen, user, setUser, t } = useGame();
  const [tab, setTab] = useState<'GLOBAL' | 'FRIENDS'>('GLOBAL');
  const [timeTab, setTimeTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [players, setPlayers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [addFriendMsg, setAddFriendMsg] = useState('');

  useEffect(() => {
    api.get('/games/leaderboards/global').then(res => {
      if (res.data) {
        const mapped = res.data.map((p: any) => ({
          ...p,
          avatar: p.avatarUrl || "🎮",
          isUser: p.userId === user.id || p.name === user.name
        }));
        setPlayers(mapped);
      }
    }).catch(e => console.error(e));

    if (!user.friendCode) {
      api.get('/friends/my-code').then(res => {
        if (res.data?.friendCode) {
          setUser({ ...user, friendCode: res.data.friendCode });
        }
      }).catch(() => {});
    }
  }, [user.id]);

  useEffect(() => {
    if (tab === 'FRIENDS') {
      loadFriends();
    }
  }, [tab]);

  const loadFriends = () => {
    Promise.all([
      api.get('/friends/leaderboard'),
      api.get('/friends/pending')
    ]).then(([lb, pending]) => {
      setFriends(lb.data || []);
      setPendingReqs(pending.data || []);
    }).catch(() => {});
  };

  const handleAddFriend = async () => {
    if (!friendCodeInput.trim()) return;
    setAddingFriend(true);
    setAddFriendMsg('');
    try {
      const res = await api.post('/friends/add', { friendCode: friendCodeInput.trim().toUpperCase() });
      setAddFriendMsg(`✅ ${res.data.message}`);
      setFriendCodeInput('');
    } catch (e: any) {
      setAddFriendMsg(`❌ ${e.response?.data?.message || 'Ошибка'}`);
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAccept = async (id: string) => {
    await api.post(`/friends/${id}/accept`).catch(() => {});
    loadFriends();
  };

  const handleRemove = async (id: string) => {
    await api.delete(`/friends/${id}`).catch(() => {});
    loadFriends();
  };

  const renderPlayer = (player: any, i: number) => (
    <motion.div
      key={player.id || i}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      className={`flex items-center justify-between p-4 rounded-[24px] border ${
        player.isMe || player.isUser
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
        <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-xl border border-[var(--border)] overflow-hidden">
          {player.avatarUrl?.startsWith('http')
            ? <img src={player.avatarUrl} className="w-full h-full object-cover" alt="" />
            : <span>{player.avatarUrl || player.avatar || '🎮'}</span>}
        </div>
        <div>
          <h4 className="font-bold text-sm">{player.displayName || player.name || 'Player'}</h4>
          <div className="flex items-center gap-2">
            {(player.isMe || player.isUser) && <span className="text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">You</span>}
            {player.friendCode && (
              <span 
                className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer active:scale-95" 
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(player.friendCode).catch(()=>{}) }}
              >
                ID: {player.friendCode} <Copy size={8} />
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-sm font-black text-[var(--primary)]">{player.score}</p>
          <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Points</p>
        </div>
        {tab === 'FRIENDS' && !player.isMe && player.friendshipId && (
          <button onClick={() => handleRemove(player.friendshipId)} className="p-1.5 rounded-full bg-red-500/10 border border-red-500/20 active:scale-90">
            <X size={12} className="text-red-400" />
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <ScreenWrapper>
      <div className="p-6 safe-top safe-pb flex flex-col min-h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <h2 className="text-2xl font-extrabold tracking-tight">{t.leaderboard.title}</h2>
          </div>
          <Medal size={24} className="text-[var(--secondary)]" />
        </div>

        <div className="flex bg-[var(--surface)] p-1 rounded-full mb-4 border border-[var(--border)]">
          <button 
            onClick={() => setTab('GLOBAL')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${tab === 'GLOBAL' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)]'}`}
          >
            {t.leaderboard?.global || 'Global'}
          </button>
          <button 
            onClick={() => setTab('FRIENDS')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors flex items-center justify-center gap-1.5 ${tab === 'FRIENDS' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)]'}`}
          >
            {t.leaderboard?.friends_tab || 'Friends'}
            {pendingReqs.length > 0 && (
              <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                {pendingReqs.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'GLOBAL' && (
          <div className="flex gap-2 mb-6">
            {['DAILY', 'WEEKLY', 'MONTHLY'].map(tp => (
              <button 
                key={tp}
                onClick={() => setTimeTab(tp as any)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${timeTab === tp ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
              >
                {t.leaderboard?.[tp.toLowerCase() as keyof typeof t.leaderboard] || tp}
              </button>
            ))}
          </div>
        )}

        {tab === 'FRIENDS' && (
          <div className="mb-4 space-y-3">
            {/* Add Friend Button */}
            {user.friendCode && (
              <div 
                onClick={() => { navigator.clipboard.writeText(user.friendCode).catch(()=>{}); alert(t.promo?.accepted ? 'OK' : 'Copied'); }}
                className="w-full flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--primary)]/50 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="text-[10px] font-black tracking-widest uppercase text-[var(--text-muted)]">{t.friends?.myCode || 'Ваш код:'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white tracking-[0.2em]">{user.friendCode}</span>
                  <Copy size={16} className="text-[var(--primary)]" />
                </div>
                <span className="text-[9px] text-[var(--primary)] uppercase font-bold mt-1">{t.friends?.clickToCopy || 'click to copy'}</span>
              </div>
            )}

            <button
              onClick={() => setShowAddFriend(!showAddFriend)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] text-sm font-black uppercase tracking-widest active:scale-98 transition-transform"
            >
              <Users size={16} /> {t.friends?.addFriend || 'Add Friend'}
            </button>

            {showAddFriend && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3"
              >
                <p className="text-xs text-[var(--text-muted)] font-medium">{t.friends?.enterCode || 'Enter code'}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendCodeInput}
                    onChange={e => setFriendCodeInput(e.target.value.toUpperCase())}
                    placeholder="XXXXXX"
                    maxLength={6}
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-black tracking-widest text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)]"
                  />
                  <Button onClick={handleAddFriend} disabled={addingFriend} className="px-4 py-2 text-sm font-black">
                    {addingFriend ? '...' : (t.friends?.add || 'Add')}
                  </Button>
                </div>
                {addFriendMsg && (
                  <p className={`text-xs font-medium ${addFriendMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {addFriendMsg}
                  </p>
                )}
              </motion.div>
            )}

            {/* Pending Requests */}
            {pendingReqs.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t.friends?.requests || 'Requests'} ({pendingReqs.length})</p>
                <div className="space-y-2">
                  {pendingReqs.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{req.user?.avatarUrl || '🎮'}</span>
                        <span className="text-sm font-bold">{req.user?.displayName || 'Player'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(req.id)} className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-black text-green-400 active:scale-95">
                          ✓ {t.friends?.accept || 'Accept'}
                        </button>
                        <button onClick={() => handleRemove(req.id)} className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-black text-red-400 active:scale-95">
                          ✗
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-6">
          {tab === 'GLOBAL' 
            ? players.map((player, i) => renderPlayer(player, i))
            : friends.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users size={48} className="text-[var(--text-muted)] mb-4 opacity-50" />
                  <p className="font-bold text-[var(--text-muted)]">{t.friends?.noFriends || 'No friends'}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t.friends?.addByCodeHint || 'Add by code'}</p>
                </div>
              )
              : friends.map((player, i) => renderPlayer(player, i))
          }
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
  const [adminStats, setAdminStats] = useState<any>({ totalUsers: 0, retention: 0 });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image.*/)) {
      setEditError('Пожалуйста, выберите изображение');
      return;
    }

    setIsUploading(true);
    setEditError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(async (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('file', blob, 'avatar.jpg');
              try {
                const res = await api.post('/upload', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data?.url) {
                  setEditAvatar(res.data.url);
                }
              } catch (err: any) {
                setEditError('Ошибка при загрузке: ' + (err.response?.data?.message || err.message));
              } finally {
                setIsUploading(false);
              }
            }
          }, 'image/jpeg', 0.8);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      api.get('/admin/stats').then(res => {
        if (res.data) setAdminStats(res.data);
      }).catch(console.error);
    }
    // Load friend code if not set
    if (!user.friendCode && user.role === 'USER') {
      api.get('/friends/my-code').then(res => {
        if (res.data?.friendCode) {
          setUser({ ...user, friendCode: res.data.friendCode });
        }
      }).catch(() => {});
    }
  }, [user.id, user.role, user.friendCode, setUser]);

  const fetchHistory = () => {
    api.get('/wallet/history').then(res => setHistory(res.data)).catch(e => console.error(e));
  };

  const handleSaveProfile = async () => {
    if (editName.trim().length < 2) { setEditError('Минимум 2 символа'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      const res = await api.patch('/auth/profile', {
        displayName: editName.trim(),
        avatarUrl: editAvatar.trim() || undefined
      });
      setUser({ ...user, name: res.data.displayName || editName.trim(), avatarUrl: res.data.avatarUrl || editAvatar || undefined });
      setShowEditProfile(false);
    } catch (e: any) {
      setEditError(e.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setEditSaving(false);
    }
  };

  const copyFriendCode = () => {
    if (user.friendCode) {
      navigator.clipboard.writeText(user.friendCode).catch(() => {});
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleAdminAuth = () => {
    // @ts-ignore
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || '1553688';
    if (adminPass === correctPassword) {
      const token = localStorage.getItem('arena_token');
      // @ts-ignore
      const adminUrl = import.meta.env.VITE_ADMIN_URL || (window.location.protocol + '//' + window.location.hostname + ':8080');
      window.location.href = adminUrl + (token ? '?token=' + token : '');
    } else {
      setAdminError(t.errors?.adminPassError || 'Неверный пароль доступа');
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
            <BackButton />
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
              {user.avatarUrl ? (
                user.avatarUrl.startsWith('http') 
                  ? <img src={user.avatarUrl} className="w-14 h-14 rounded-full object-cover relative z-10" alt="avatar" />
                  : <span className="text-5xl relative z-10">{user.avatarUrl}</span>
              ) : (
                <Logo className="w-16 h-16 text-[var(--primary)] relative z-10 drop-shadow-2xl" />
              )}
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
            {/* Edit button */}
            <button
              onClick={() => { setEditName(user.name); setEditAvatar(user.avatarUrl || ''); setShowEditProfile(true); }}
              className="absolute -top-1 -right-1 w-8 h-8 bg-[var(--primary)] rounded-full border-2 border-[var(--bg)] flex items-center justify-center z-30 shadow-lg active:scale-90 transition-transform"
            >
              <Pencil size={13} className="text-white" />
            </button>
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
          {/* Friend Code */}
          {user.friendCode && user.role === 'USER' && (
            <button
              onClick={copyFriendCode}
              className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-transform"
            >
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t.profile.yourCode || 'CODE:'}</span>
              <span className="text-sm font-black text-white tracking-widest">{user.friendCode}</span>
              {codeCopied 
                ? <CheckCircle2 size={13} className="text-green-400" />
                : <Copy size={13} className="text-[var(--text-muted)]" />}
            </button>
          )}
        </div>

        <div className="flex-1 space-y-6">
          {/* Role Specific Sections */}
          {user.role === 'USER' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] relative overflow-hidden shadow-sm">
                  <Trophy size={20} className="text-[var(--primary)] mb-3" />
                  <p className="text-3xl font-black tracking-tight">{user.highScore}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{t.profile.bestScore || 'Best Score'}</p>
                </div>
                <div className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] relative overflow-hidden shadow-sm">
                  <Ticket size={20} className="text-[var(--secondary)] mb-3" />
                  <p className="text-3xl font-black tracking-tight">{user.points}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{t.profile.points}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setScreen('MY_PRIZES')}
                  className="w-full p-5 bg-[var(--surface)] rounded-[24px] border border-[var(--primary)]/30 flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 to-transparent" />
                  <div className="flex items-center gap-3 relative z-10">
                    <Gift size={20} className="text-[var(--primary)]" />
                    <span className="text-lg font-bold">{t.profile.prizesShop || 'Мои Призы'}</span>
                  </div>
                  <ChevronRight size={22} className="text-[var(--primary)] relative z-10" />
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
                    <span className="text-lg font-bold">{t.profile.transactionHistory || 'Transaction History'}</span>
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
                  <p className="text-lg font-black">{adminStats.totalUsers > 1000 ? (adminStats.totalUsers/1000).toFixed(1) + 'k' : adminStats.totalUsers}</p>
                  <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t.profile.users || 'Users'}</p>
                </div>
                <div className="bg-[var(--surface)] p-4 rounded-[24px] border border-[var(--border)]">
                  <p className="text-lg font-black">{adminStats.retention}%</p>
                  <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t.profile.retention || 'Retention'}</p>
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
                const confirmed = window.confirm(t.accountChecks?.deleteWarning || 'Вы уверены, что хотите НАВСЕГДА удалить свой аккаунт? Все ваши очки и достижения будут стерты, а вы не сможете зарегистрироваться на этот номер в течение 1 месяца!');
                if (confirmed) {
                  try {
                    await api.delete('/auth/me');
                    alert(t.accountChecks?.deleteSuccess || 'Ваш аккаунт был успешно удален.');
                    logout();
                    setScreen('WELCOME');
                  } catch (e: any) {
                    alert(e.response?.data?.message || t.accountChecks?.deleteError || 'Ошибка удаления аккаунта');
                  }
                }
              }}
              className="w-full mt-4 p-4 text-[var(--danger)]/80 hover:text-[var(--danger)] bg-[var(--danger)]/5 border border-[var(--danger)]/20 rounded-[24px] font-black text-sm uppercase tracking-widest text-center active:scale-[0.98] transition-all"
            >
              {t.accountChecks?.deleteAccount || 'Удалить аккаунт'}
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
                  <h3 className="text-2xl font-black">{t.profile.transactionHistory || 'Transaction History'}</h3>
                  <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-[var(--surface)] rounded-full active:scale-95">
                    <XCircle size={24} className="text-[var(--text)]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                  {history.length === 0 ? (
                    <div className="text-center p-8 text-[var(--text-muted)]">
                      <History size={48} className="mx-auto mb-4 opacity-50" />
                      <p>{t.profile.noTransactions || 'No transactions yet'}</p>
                    </div>
                  ) : (
                    history.map(tx => (
                      <div key={tx.id} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{tx.referenceType === 'PROMO' ? (t.profile.promoCode || 'Promo Code') : tx.referenceType === 'GAME_SESSION' ? (t.profile.gameReward || 'Game Reward') : tx.type}</p>
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

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-0 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[var(--bg)] rounded-t-[32px] p-6 border border-[var(--border)] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black">{t.profile.editProfile || 'Редактировать'}</h3>
                <button onClick={() => setShowEditProfile(false)} className="p-2 bg-[var(--surface)] rounded-full active:scale-95">
                  <X size={22} className="text-[var(--text)]" />
                </button>
              </div>

              {/* Avatar selector */}
              <div className="mb-5">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">{t.profile.avatarSelect || 'Аватар'}</p>
                <div className="flex gap-3 flex-wrap mb-3">
                  {['🎮','🦊','🐉','⚡','🏆','🎯','🔥','🌟','🚀','🤖','💎','👾'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-10 h-10 text-2xl rounded-2xl flex items-center justify-center transition-all ${
                        editAvatar === emoji ? 'bg-[var(--primary)]/20 border-2 border-[var(--primary)] scale-110' : 'bg-[var(--surface)] border border-[var(--border)]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <label className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface-accent)] cursor-pointer border border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-2xl px-4 py-3 text-sm text-[var(--text)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                      {isUploading ? (
                        <span className="animate-pulse">{t.profile.uploading || 'Oбработка...'}</span>
                      ) : (
                        <>
                          <ImageIcon size={18} className="text-[var(--primary)]" />
                          <span className="text-[var(--text-muted)] group-hover:text-[var(--text)]">{t.profile.uploadPhoto || 'Загрузить фото'}</span>
                        </>
                      )}
                    </label>
                    {editAvatar && !isUploading && (
                      <div className="w-12 h-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                        {editAvatar.startsWith('http') || editAvatar.startsWith('data:image')
                          ? <img src={editAvatar} className="w-full h-full object-cover rounded-xl" alt="" />
                          : editAvatar}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    placeholder={t.profile.orTypeEmoji || "Или введите вручную"}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="mb-6">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">{t.profile.name || 'Имя'}</p>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={30}
                  placeholder={t.profile.name ? `${t.profile.name}...` : "Ваше имя..."}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors font-bold"
                />
                {editError && <p className="text-red-400 text-xs mt-2 font-medium">{editError}</p>}
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={editSaving}
                className="w-full py-4 font-black text-base tracking-wider"
              >
                {editSaving ? (t.profile.saving || '...') : (t.profile.save || 'Сохранить')}
              </Button>
            </motion.div>
          </div>
        )}

        {showAdminPrompt && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--bg)] p-6 rounded-[32px] w-full max-w-sm border border-[var(--border)] shadow-2xl">
              <h3 className="text-xl font-black mb-2 tracking-tight flex items-center gap-2">
                <Shield size={20} className="text-[var(--secondary)]" /> 
                {t.accountChecks?.adminPanelEnter || 'Переход в Админ-Панель'}
              </h3>
              <p className="text-[var(--text-muted)] text-sm font-medium mb-6">{t.accountChecks?.adminPanelDesc || 'Введите универсальный пароль администратора.'}</p>
              
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
                  {t.accountChecks?.cancel || 'Отмена'}
                </button>
                <button 
                  onClick={handleAdminAuth}
                  className="flex-1 py-3.5 bg-[var(--secondary)] text-black font-extrabold rounded-2xl active:scale-95 transition-transform"
                >
                  {t.accountChecks?.submit || 'Войти'}
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
          <BackButton />
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
          <BackButton />
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
