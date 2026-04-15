import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useGame } from '../context/GameContext';
import { ScreenWrapper, Button, LanguageSwitcher } from '../components/Shared';
import { Gamepad2, Grid, Trophy } from 'lucide-react-native';

export const OnboardingScreen = () => {
  const { setScreen, t } = useGame();
  const [step, setStep] = useState(0);
  
  const slides = [
    {
      title: t.onboarding[0].title,
      desc: t.onboarding[0].desc,
      icon: <Gamepad2 size={56} color="#3b82f6" /> // primary
    },
    {
      title: t.onboarding[1].title,
      desc: t.onboarding[1].desc,
      icon: <Grid size={56} color="#ec4899" /> // secondary
    },
    {
      title: t.onboarding[2].title,
      desc: t.onboarding[2].desc,
      icon: <Trophy size={56} color="#22c55e" /> // success
    }
  ];

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else setScreen('EVENTS');
  };

  return (
    <ScreenWrapper className="p-6 pt-12 flex-1 flex-col">
      <View className="flex-row justify-between mb-6">
        <LanguageSwitcher />
      </View>
      
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 bg-zinc-900 rounded-[32px] flex items-center justify-center mb-6 border border-zinc-800">
          {slides[step].icon}
        </View>
        <Text className="text-white text-3xl font-extrabold tracking-tight mb-2 text-center">{slides[step].title}</Text>
        <Text className="text-zinc-400 text-base max-w-[260px] text-center">{slides[step].desc}</Text>
      </View>
      
      <View className="flex-row items-center justify-between mt-auto mb-10 pt-6">
        <View className="flex-row gap-2">
          {slides.map((_, i) => (
            <View 
              key={i} 
              className={`h-2 rounded-full ${i === step ? 'w-10 bg-blue-500' : 'w-2 bg-zinc-800'}`} 
            />
          ))}
        </View>
        <Button onClick={next} className="px-10 py-4 rounded-3xl">
          {step === slides.length - 1 ? t.common.finish : t.common.next}
        </Button>
      </View>
    </ScreenWrapper>
  );
};
