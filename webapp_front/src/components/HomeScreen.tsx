import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Coins, LogOut, Play, Gift } from 'lucide-react';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        // Token invalid, logout
        localStorage.removeItem('arena_token');
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse text-violet-500">Loading profile...</div></div>;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#050505] text-white overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-[-20%] w-[140%] h-[300px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-black to-black -z-10 blur-3xl"></div>

      <header className="px-6 pt-10 pb-6 flex justify-between items-center z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div>
          <h2 className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">Player</h2>
          <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 truncate w-32">
            {user.displayName || user.phone}
          </p>
        </div>
        <button onClick={() => { localStorage.removeItem('arena_token'); navigate('/login'); }} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 active:scale-95">
          <LogOut className="w-5 h-5 text-zinc-400" />
        </button>
      </header>

      <div className="flex-1 px-6 py-8 flex flex-col gap-8 z-10">
        
        {/* Balance Card */}
        <div className="w-full rounded-3xl bg-gradient-to-br from-zinc-900 to-black p-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-violet-500/50 transition-all duration-500">
          <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-violet-600/20 rounded-full blur-3xl group-hover:bg-violet-600/40 transition-all"></div>
          <p className="text-zinc-400 font-semibold uppercase tracking-widest text-sm mb-2 opacity-80">Wallet Balance</p>
          <div className="flex items-center gap-3">
            <Coins className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h1 className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {Number(user.points).toLocaleString()}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 mt-4">(Pts) Secure Ledger Sync</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-4">
          <button 
            onClick={() => navigate('/game')}
            className="w-full relative rounded-2xl p-[1px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 active:scale-[0.98] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            <div className="w-full bg-black/80 backdrop-blur-xl rounded-2xl px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-violet-400 ml-1" fill="currentColor" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Tap Arena</h3>
                  <p className="text-zinc-400 text-sm">Farm points fast!</p>
                </div>
              </div>
            </div>
          </button>

          <button className="w-full relative rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl px-6 py-5 flex items-center justify-between hover:bg-zinc-800 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-rose-400" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Redeem Prizes</h3>
                <p className="text-zinc-400 text-sm">Use points in Venues</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
