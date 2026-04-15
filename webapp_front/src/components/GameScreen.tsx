import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Loader2, ArrowLeft, Trophy, Zap, AlertTriangle } from 'lucide-react';

function generateIdempotencyKey() {
  return 'idemp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
}

export default function GameScreen() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'SUBMITTING' | 'DONE'>('IDLE');
  const [result, setResult] = useState<any>(null);
  
  const navigate = useNavigate();

  // Start the game session
  useEffect(() => {
    const startGame = async () => {
      try {
        setLoading(true);
        // Start ARENA_RUNNER game
        const res = await api.post('/games/ARENA_RUNNER/start');
        setSession(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to start game session. Daily limit reached?');
      } finally {
        setLoading(false);
      }
    };
    startGame();
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (status === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (status === 'PLAYING' && timeLeft === 0) {
      submitScore();
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleTap = useCallback(() => {
    if (status === 'IDLE') {
      setStatus('PLAYING');
      setScore(1);
      return;
    }
    
    if (status === 'PLAYING') {
      setScore((s) => s + 1);
    }
  }, [status]);

  const submitScore = async () => {
    if (!session) return;
    setStatus('SUBMITTING');
    
    try {
      const idempotencyKey = generateIdempotencyKey();
      const res = await api.post(
        `/games/ARENA_RUNNER/submit`,
        {
          sessionId: session.sessionId,
          score: score,
          timePlayedSeconds: 10
        },
        {
          headers: { 'idempotency-key': idempotencyKey }
        }
      );
      setResult(res.data);
      setStatus('DONE');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit score / Anticheat block');
      setStatus('DONE');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error && status === 'IDLE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Notice</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button onClick={() => navigate('/home')} className="w-full bg-white text-black font-bold py-3 rounded-2xl">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden select-none touch-none">
      
      {/* Background depending on state */}
      <div className={`absolute inset-0 -z-10 transition-colors duration-1000 ${status === 'PLAYING' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/40 via-black to-black' : 'bg-black'}`}></div>

      <header className="absolute top-0 w-full p-6 flex justify-between z-10">
        <button onClick={() => navigate('/home')} className="p-3 bg-white/5 rounded-full backdrop-blur-md border border-white/10" disabled={status === 'PLAYING'}>
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-xl font-bold font-mono">
          <Trophy className="w-5 h-5 text-yellow-400" />
          {score}
        </div>
      </header>

      {status === 'DONE' ? (
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] max-w-[320px] w-full text-center z-10 shadow-2xl animate-in zoom-in">
          {error ? (
            <>
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Score Rejected</h2>
              <p className="text-zinc-400 mb-6">{error}</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Trophy className="w-12 h-12 text-yellow-400" />
              </div>
              <h2 className="text-3xl font-extrabold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Victory!</h2>
              <p className="text-zinc-400 mb-8">Points awarded successfully</p>
              
              <div className="bg-black/50 rounded-2xl p-4 mb-8 border border-white/5">
                <p className="text-sm text-zinc-500 uppercase tracking-widest mb-1">Earned Points</p>
                <p className="text-4xl font-bold text-green-400">+{result?.awardedPoints}</p>
              </div>
            </>
          )}

          <button onClick={() => navigate('/home')} className="w-full bg-white text-black font-bold py-4 rounded-2xl text-lg active:scale-95 transition-all">
            Continue
          </button>
        </div>
      ) : status === 'SUBMITTING' ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500 mb-4" />
          <p className="text-zinc-400 animate-pulse">Syncing ledger...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center z-10 w-full px-6">
          <div className="text-5xl font-extrabold mb-12 tabular-nums">
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
          
          <button 
            onTouchStart={handleTap}
            onMouseDown={handleTap}
            autoFocus
            className={`
              w-64 h-64 rounded-full flex items-center justify-center
              bg-gradient-to-tr from-violet-600 to-fuchsia-500
              shadow-[0_0_80px_rgba(139,92,246,0.3)]
              active:scale-95 active:shadow-[0_0_100px_rgba(139,92,246,0.8)]
              transition-all duration-75 relative
            `}
          >
            <div className="w-56 h-56 rounded-full bg-gradient-to-br from-black/20 to-black/60 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Zap className={`w-24 h-24 text-white ${status === 'PLAYING' ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'opacity-80'}`} fill={status === 'PLAYING' ? 'white' : 'none'} />
            </div>
            
            {status === 'IDLE' && (
              <div className="absolute -bottom-8 bg-white/10 backdrop-blur-md px-6 py-2 border border-white/20 rounded-full animate-pulse text-sm font-semibold">
                TAP TO START
              </div>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
