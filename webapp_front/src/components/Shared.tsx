import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, ArrowLeft } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Language } from '../translations';

export const BackButton = ({ onClick, className = "" }: { onClick: () => void; className?: string }) => {
  const { t } = useGame();
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-white/20 text-white shadow-xl backdrop-blur-2xl transition-all hover:scale-105 active:scale-90 z-[100] ${className}`}
    >
      <ArrowLeft size={20} />
      <span className="text-sm font-bold tracking-tight">{t.common.back}</span>
    </button>
  );
};

export const LanguageSwitcher = ({ className = "" }: { className?: string }) => {
  const { language, setLanguage, theme } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const langs: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' }
  ];

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border border-[var(--border)] transition-all hover:bg-[var(--surface-accent)] ${
          theme === 'dark' ? 'glass' : 'glass-light'
        }`}
      >
        <Languages size={18} className="text-[var(--primary)]" />
        <span className="font-medium">{langs.find(l => l.code === language)?.flag}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute right-0 mt-3 w-40 border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl z-50 backdrop-blur-3xl ${
              theme === 'dark' ? 'bg-[var(--surface)]/90' : 'bg-white/90'
            }`}
          >
            {langs.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-medium transition-colors hover:bg-[var(--primary)]/10 ${
                  language === l.code ? 'text-[var(--primary)] bg-[var(--primary)]/5' : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ScreenWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className="fixed inset-0 bg-[var(--bg)] text-[var(--text)] overflow-y-auto flex flex-col"
  >
    {children}
  </motion.div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)] hover:brightness-110 active:scale-[0.97]',
    secondary: 'bg-[var(--surface-accent)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] active:scale-[0.97]',
    outline: 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 active:scale-[0.97]',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 active:scale-[0.97]'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      onClick={onClick}
      className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};
