import React from 'react';
import { View, Text, Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { ScreenWrapper, Button, LanguageSwitcher } from '../components/Shared';

export const WelcomeScreen = () => {
  const { setScreen, t } = useGame();
  return (
    <ScreenWrapper className="flex-1">
      <View className="absolute top-10 right-6 z-50 flex-row gap-3">
        <LanguageSwitcher />
      </View>
      <View className="flex-1 items-center justify-center p-8">
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000" }} 
          className="absolute inset-0 w-full h-full opacity-40" 
        />
        <View className="z-20 w-full flex items-center">
          <Text className="text-5xl font-black text-white uppercase text-center mb-4">{t.welcome.title}</Text>
          <Text className="text-zinc-300 text-lg mb-10 text-center">{t.welcome.desc}</Text>
          <Button onClick={() => setScreen('LOGIN')} className="w-full py-5 rounded-3xl">
            {t.welcome.getStarted}
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};
