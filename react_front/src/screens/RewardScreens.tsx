import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useGame } from '../context/GameContext';
import { ScreenWrapper, Button, BackButton } from '../components/Shared';
import { CheckCircle2, Trophy, Medal } from 'lucide-react-native';
import { api } from '../api';

export const PromoCodeScreen = () => {
  const { setScreen, addPoints, t } = useGame();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const activate = async () => {
    if (!code.trim()) return;
    
    try {
      const res = await api.post('/wallet/redeem-promo', { code });
      if (res.data && res.data.success) {
        addPoints(res.data.awarded);
        setStatus('success');
        setTimeout(() => setScreen('GAME_BOARD'), 1500);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (e) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <ScreenWrapper className="p-6 pt-12 flex-1">
      <View className="mb-12">
        <BackButton onClick={() => setScreen('PROFILE')} />
      </View>
      
      <View className="flex-1">
        <Text className="text-white text-4xl font-extrabold tracking-tight mb-3">{t.promo.title}</Text>
        <Text className="text-zinc-400 text-lg mb-12 font-medium">{t.promo.desc}</Text>

        <View className="space-y-6 gap-4">
          <View className="relative justify-center">
            <TextInput 
              value={code}
              onChangeText={setCode}
              placeholder="ARENA100"
              placeholderTextColor="#52525b"
              autoCapitalize="characters"
              className={`w-full bg-zinc-900 border rounded-3xl px-8 py-6 text-white text-3xl font-black tracking-[8px] uppercase ${
                status === 'success' ? 'border-green-500 text-green-500' : 
                status === 'error' ? 'border-red-500 text-red-500' : 
                'border-zinc-800 focus:border-blue-500'
              }`}
            />
            {status === 'success' && (
              <View className="absolute right-6">
                <CheckCircle2 color="#22c55e" size={32} />
              </View>
            )}
          </View>

          {status === 'success' && (
            <Text className="text-center text-green-500 font-bold text-lg mt-4">{t.promo.accepted}</Text>
          )}
          {status === 'error' && (
            <Text className="text-center text-red-500 font-bold text-lg mt-4">{t.promo.invalid}</Text>
          )}
        </View>
      </View>

      <View className="mb-10 mt-6">
        <Button 
          onClick={activate} 
          disabled={code.length === 0 || status === 'success'}
          className="w-full py-5 text-xl rounded-3xl"
        >
          {t.promo.activate}
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export const ResultScreen = () => {
  const { setScreen, t, user } = useGame();
  
  return (
    <ScreenWrapper className="p-8 pt-12 flex-1 flex-col items-center">
      <View className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-blue-500/30">
        <Trophy color="#3b82f6" size={48} />
      </View>

      <Text className="text-white text-4xl font-black mb-2 tracking-tight">{t.result.congrats}</Text>
      <Text className="text-zinc-400 text-lg mb-8 font-medium text-center">
        {t.result.youWon} <Text className="text-white font-bold">{user.highScore}</Text> {t.result.prizes}
      </Text>

      <View className="w-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800 mb-8 items-center">
        <Text className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-widest">{t.result.yourPrize}</Text>
        <View className="flex-row items-center gap-3 mb-2">
          <Medal color="#ec4899" size={24} />
          <Text className="text-3xl font-black text-white">#12</Text>
        </View>
        <Text className="text-zinc-400 text-sm font-medium">{t.result.noPrizes}</Text>
      </View>

      <View className="w-full mt-auto mb-10 gap-4">
        <Button onClick={() => setScreen('GAME_BOARD')} className="w-full py-5 rounded-3xl">
          {t.result.viewBoard}
        </Button>
        <Button 
          onClick={() => setScreen('EVENTS')}
          variant="secondary"
          className="w-full py-5 rounded-3xl"
        >
          {t.result.backEvents}
        </Button>
      </View>
    </ScreenWrapper>
  );
};
