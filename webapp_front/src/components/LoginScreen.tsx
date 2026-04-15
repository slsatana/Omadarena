import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { api } from '../api';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [step, setStep] = useState<'PHONE' | 'SMS'>('PHONE');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setScreen, loadUser } = useGame();

  const handleSendSms = async () => {
    try {
      setLoading(true);
      setError('');
      if (mode === 'REGISTER' && !displayName.trim()) {
        setError('Please enter your nickname');
        return;
      }
      if (phone.length < 9) {
        setError('Invalid phone number');
        return;
      }
      await api.post('/auth/send-sms', { phone });
      setStep('SMS');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');
      
      let deviceId = localStorage.getItem('arena_device_id');
      if (!deviceId) {
        deviceId = 'web-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('arena_device_id', deviceId);
      }

      const payload: any = { phone, code, deviceId };
      if (mode === 'REGISTER' && displayName.trim()) {
        payload.displayName = displayName.trim();
      }

      const res = await api.post('/auth/verify', payload);
      if (res.data.accessToken) {
        localStorage.setItem('arena_token', res.data.accessToken);
        
        // Load user data into context
        if (loadUser) {
          await loadUser();
        }
        
        // Show onboarding for new users, otherwise go to home/events
        if (res.data.isNewUser) {
          setScreen('ONBOARDING');
        } else {
          setScreen('EVENTS');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid SMS Code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black -z-10 blur-3xl"></div>
      
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)]">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 mb-3">
          OMAD ARENA
        </h1>
        <p className="text-zinc-400 font-medium">Play, Earn, Redeem.</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {step === 'PHONE' ? (
          <>
            <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-2">
              <button
                onClick={() => setMode('LOGIN')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'LOGIN' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setMode('REGISTER')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'REGISTER' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                REGISTER
              </button>
            </div>

            {mode === 'REGISTER' && (
              <div className="flex flex-col gap-2">
                <label className="text-zinc-400 text-sm font-semibold uppercase tracking-wider pl-1">Nickname</label>
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-lg rounded-2xl px-5 py-4 outline-none focus:border-violet-500 focus:bg-zinc-900 transition-all text-center tracking-wide placeholder-zinc-700 font-medium"
                  placeholder="PlayerOne"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-zinc-400 text-sm font-semibold uppercase tracking-wider pl-1">Phone Number</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-lg rounded-2xl px-5 py-4 outline-none focus:border-violet-500 focus:bg-zinc-900 transition-all text-center tracking-widest placeholder-zinc-700 font-medium"
                placeholder="+998 90 000 00 00"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            <button 
              onClick={handleSendSms}
              disabled={loading || phone.length < 9}
              className="mt-4 w-full bg-white text-black font-bold text-lg rounded-2xl px-5 py-4 flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continue'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-zinc-400 text-sm font-semibold uppercase tracking-wider pl-1">SMS Code</label>
              <input 
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-3xl rounded-2xl px-5 py-4 outline-none focus:border-violet-500 focus:bg-zinc-900 transition-all text-center tracking-[0.5em] font-bold"
                placeholder="000000"
                maxLength={6}
              />
              <p className="text-zinc-500 text-xs text-center mt-2">Enter code sent to {phone}</p>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            <button 
              onClick={handleVerify}
              disabled={loading || code.length < 4}
              className="mt-4 w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-lg rounded-2xl px-5 py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'REGISTER' ? 'Create Account' : 'Verify & Enter')}
            </button>
            <button
               onClick={() => { setStep('PHONE'); setCode(''); setError(''); }}
               className="mt-4 text-zinc-400 text-sm font-medium hover:text-white"
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
