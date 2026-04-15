import React, { ReactNode } from 'react';
import { View, TouchableOpacity, Text, TextInput, ScrollView, Animated } from 'react-native';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Languages } from 'lucide-react-native';

export const ScreenWrapper = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <View className={`flex-1 bg-black w-full relative ${className}`}>
    <View className="flex-1 bg-zinc-950 w-full relative mx-auto">
      {children}
    </View>
  </View>
);

export const Button = ({ children, onClick, className, disabled, variant = 'primary' }: any) => (
  <TouchableOpacity 
    onPress={onClick} 
    disabled={disabled}
    className={`justify-center items-center rounded-3xl ${
      variant === 'primary' ? 'bg-blue-600' : 'bg-zinc-800'
    } ${disabled ? 'opacity-50' : 'opacity-100'} ${className}`}
  >
    <Text className="text-white font-bold text-center text-lg">{children}</Text>
  </TouchableOpacity>
);

export const BackButton = ({ onClick }: { onClick: () => void }) => (
  <TouchableOpacity onPress={onClick} className="w-10 h-10 bg-zinc-800/80 rounded-full flex items-center justify-center">
    <ArrowLeft color="#fff" size={24} />
  </TouchableOpacity>
);

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useGame();
  
  return (
    <TouchableOpacity 
      onPress={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
      className="flex-row items-center bg-zinc-800/80 py-1.5 px-3 rounded-full"
    >
      <Languages color="#fff" size={16} />
      <Text className="text-white text-xs ml-1 font-bold">{language.toUpperCase()}</Text>
    </TouchableOpacity>
  );
};
