import React from 'react';
import { motion } from 'motion/react';
import { Gift, Zap, Ticket } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { BackButton } from './Shared';

export const ShopContent = ({ onBack, embedded = false }: { onBack: () => void, embedded?: boolean }) => {
  const { user, setUser, prizes, selectedGameId, t } = useGame();

  const shopItems = prizes
    .filter(p => p.gameId === selectedGameId && p.available)
    .map(p => ({ ...p, icon: p.image, desc: p.description, cost: p.pointsCost }));

  const handleBuy = (item: any) => {
    if (user.points >= item.cost) {
      if (confirm((t.shop?.purchaseConfirm || 'Purchase {name} for {cost} points?').replace('{name}', item.name).replace('{cost}', item.cost))) {
        setUser({ ...user, points: user.points - item.cost });
        alert((t.shop?.purchaseSuccess || 'Successfully purchased: {name}!').replace('{name}', item.name));
      }
    } else {
      alert((t.shop?.notEnoughPoints || 'Not enough points! You need {diff} more.').replace('{diff}', (item.cost - user.points).toString()));
    }
  };

  return (
    <div className={`flex flex-col h-full w-full ${embedded ? 'bg-[#050505] p-6 text-white overflow-y-auto' : 'p-6 safe-top safe-pb flex flex-col min-h-full'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <h2 className="text-2xl font-extrabold tracking-tight italic">{t.shop?.prizeMarket || 'Prize Market'}</h2>
        </div>
        <div className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border)]">
          <Ticket size={14} className="text-[var(--secondary)]" />
          <span className="text-xs font-black">{user.points}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-6">
        {shopItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
            <Gift size={48} className="mb-4 text-[var(--text-muted)] opacity-50" />
            <p className="font-bold text-[var(--text-muted)]">{t.shop?.noPrizes || 'No prizes found for this game yet.'}</p>
          </div>
        ) : (
          shopItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[var(--surface)] rounded-[32px] border border-[var(--border)] p-5 relative overflow-hidden group active:scale-[0.98] transition-transform"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-5 blur-3xl -mr-16 -mt-16" />
              
              <div className="flex gap-5 relative z-10">
                <div className="w-20 h-20 bg-[var(--bg)] rounded-[24px] border border-[var(--border)] flex items-center justify-center text-4xl shadow-inner overflow-hidden">
                  {item.icon?.startsWith('http') || item.icon?.startsWith('/') ? (
                    <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-extrabold tracking-tight mb-1">{item.name}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium leading-tight mb-3">{item.desc}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-[var(--primary)]" />
                      <span className="text-sm font-black">{item.cost === 0 ? 'FREE' : item.cost}</span>
                      {item.cost > 0 && <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest ml-1">pts</span>}
                    </div>
                    <button 
                      onClick={() => handleBuy(item)}
                      disabled={user.points < item.cost}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                        item.cost === 0 
                          ? 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]' 
                          : user.points >= item.cost
                            ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_rgba(10,132,255,0.3)]'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {item.cost === 0 ? (t.shop?.equipped || 'Equipped') : user.points >= item.cost ? (t.shop?.buy || 'Buy') : (t.shop?.locked || 'Locked')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
