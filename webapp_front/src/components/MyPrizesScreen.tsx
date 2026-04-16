import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, ArrowLeft, Loader2, QrCode, Calendar, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { api } from '../api';

export const MyPrizesScreen = () => {
  const { setScreen } = useGame();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  useEffect(() => {
    api.get('/prizes/my')
      .then(res => {
        setClaims(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch prizes:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-6 safe-top safe-pb min-h-screen bg-[var(--bg)] text-[var(--text)] relative">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setScreen('PROFILE')}
          className="w-10 h-10 bg-[var(--surface)] shrink-0 rounded-full flex items-center justify-center border border-[var(--border)] active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-[var(--text)]" />
        </button>
        <h2 className="text-2xl font-extrabold tracking-tight italic">Мои Призы</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
            <Gift size={48} className="mb-4 text-[var(--text-muted)] opacity-50" />
            <p className="font-bold text-[var(--text-muted)]">У вас пока нет купленных призов.</p>
          </div>
        ) : (
          claims.map((claim, i) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedClaim(claim)}
              className="bg-[var(--surface)] p-5 rounded-[24px] border border-[var(--border)] relative overflow-hidden shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-28 h-28 bg-[var(--bg)] rounded-[16px] overflow-hidden flex items-center justify-center border border-[var(--border)]">
                  {claim.image?.startsWith('http') || claim.image?.startsWith('/') ? (
                    <img src={claim.image} alt={claim.name} className="w-full h-full object-cover" />
                  ) : (
                    <Gift size={40} className="text-[var(--primary)]" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black">{claim.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{claim.description}</p>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <QrCode size={14} className="text-[var(--primary)]" />
                        <span className="text-xs font-bold font-mono tracking-wider">{claim.qrCodeData.split('-')[0].toUpperCase()}...</span>
                      </div>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                        claim.status === 'PURCHASED' ? 'bg-yellow-500/20 text-yellow-500' :
                        claim.status === 'REDEEMED' ? 'bg-green-500/20 text-green-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium">
                      <Calendar size={12} />
                      <span>Истекает: {new Date(claim.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--surface)] w-full max-w-sm rounded-[32px] p-6 flex flex-col items-center relative border border-[var(--border)] shadow-2xl"
            >
              <button 
                onClick={() => setSelectedClaim(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-[var(--bg)] rounded-full flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] active:scale-90"
              >
                <X size={16} />
              </button>

              <div className="w-20 h-20 bg-[var(--bg)] rounded-[16px] overflow-hidden mb-4 border border-[var(--primary)]/30 flex items-center justify-center shadow-lg">
                {selectedClaim.image?.startsWith('http') || selectedClaim.image?.startsWith('/') ? (
                  <img src={selectedClaim.image} alt={selectedClaim.name} className="w-full h-full object-cover" />
                ) : (
                  <Gift size={32} className="text-[var(--primary)]" />
                )}
              </div>

              <h3 className="text-2xl font-black text-center leading-tight mb-2">{selectedClaim.name}</h3>
              <p className="text-xs text-[var(--text-muted)] text-center mb-6">
                Продиктуйте этот код сотруднику заведения для получения приза
              </p>

              <div className="bg-[var(--bg)] w-full py-6 px-4 rounded-[20px] shadow-inner border border-[var(--border)] flex flex-col items-center justify-center mb-2 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent pointer-events-none" />
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-2 relative z-10">Уникальный Код Приза</span>
                <span className="font-mono font-black tracking-[0.3em] text-3xl text-white drop-shadow-md relative z-10">{selectedClaim.qrCodeData.split('-')[0].toUpperCase()}</span>
              </div>

              <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full mt-2 ${
                selectedClaim.status === 'PURCHASED' ? 'bg-yellow-500/20 text-yellow-500' :
                selectedClaim.status === 'REDEEMED' ? 'bg-green-500/20 text-green-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {selectedClaim.status === 'PURCHASED' ? 'ОЖИДАЕТ ВЫДАЧИ' : selectedClaim.status}
              </span>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
