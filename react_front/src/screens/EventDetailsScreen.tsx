import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useGame } from '../context/GameContext';
import { ScreenWrapper, Button, BackButton } from '../components/Shared';
import { Medal, Gift } from 'lucide-react-native';
import { api } from '../api';

export const EventDetailsScreen = () => {
  const { setScreen, t, selectedGameId, prizes, gamesStats } = useGame();
  const [leaderboard, setLeaderboard] = useState<{rank: number, name: string, score: number}[]>([]);
  
  useEffect(() => {
    api.get(`/games/${selectedGameId}/leaderboard`)
       .then(r => setLeaderboard(r.data))
       .catch(e => console.error("Leaderboard fetch failed", e));
  }, [selectedGameId]);
  
  const gameBackgrounds: Record<string, string> = {
    ARENA_RUNNER: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
    NEON_JUMP: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    CYBER_SHIELD: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800",
    HIGHER_LOWER: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800",
    SNAKE: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
    SKY_STACK: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    MATCH3: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=800"
  };

  const stat = gamesStats[selectedGameId];
  const gameInfo = t.gameDetails[selectedGameId as keyof typeof t.gameDetails] || t.gameDetails.ARENA_RUNNER;
  let displayTitle = gameInfo.title;
  if (stat?.displayName) displayTitle = stat.displayName;
  const bgImage = stat?.imageUrl || gameBackgrounds[selectedGameId] || gameBackgrounds.ARENA_RUNNER;
  const gamePrizesCount = prizes.filter(p => p.gameId === selectedGameId).length;

  return (
    <ScreenWrapper className="flex-1">
      <View className="h-[40%] relative">
        <Image 
          source={{ uri: bgImage }} 
          className="w-full h-full"
        />
        <View className="absolute top-12 left-6 z-20">
          <BackButton onClick={() => setScreen('EVENTS')} />
        </View>
      </View>
      
      <View className="flex-1 px-6 -mt-10 bg-zinc-950 rounded-t-[48px] pt-6">
        <View className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
        
        <View className="flex-row mb-3">
          <View className="bg-blue-500/20 py-1.5 px-3 rounded-full border border-blue-500/30">
            <Text className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">{t.eventDetails.featured}</Text>
          </View>
        </View>
        
        <Text className="text-white text-3xl font-extrabold mb-2 tracking-tight">{displayTitle}</Text>
        <Text className="text-zinc-400 text-sm mb-6 leading-snug font-medium">
          {gameInfo.desc}
        </Text>

        <View className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 items-center mb-6">
          <Text className="text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-widest">{t.eventDetails.totalPrizes}</Text>
          <Text className="text-lg font-extrabold text-blue-500">{gamePrizesCount} {t.eventDetails.prizesSuffix}</Text>
        </View>

        <View className="mb-6 flex-1">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-base font-bold tracking-tight">{t.leaderboard.title}</Text>
            <Medal color="#ec4899" size={18} />
          </View>
          <ScrollView className="bg-zinc-900 rounded-3xl border border-zinc-800 min-h-[120px]">
            {leaderboard.length > 0 ? leaderboard.map((player, i) => (
              <View key={i} className={`flex-row items-center justify-between p-4 ${i !== leaderboard.length - 1 ? 'border-b border-zinc-800' : ''}`}>
                <View className="flex-row items-center gap-3">
                  <Text className={`font-black text-xs ${player.rank === 1 ? 'text-pink-500' : 'text-zinc-500'}`}>
                    #{player.rank}
                  </Text>
                  <Text className="text-white font-bold text-sm ml-2">{player.name}</Text>
                </View>
                <Text className="text-blue-500 text-xs font-bold">{player.score}</Text>
              </View>
            )) : (
              <View className="flex-1 items-center justify-center p-6">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  {t.leaderboard?.empty || 'NO SCORES YET'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View className="pb-8 space-y-4 gap-3">
          <Button 
            onClick={() => setScreen('SHOP')} 
            variant="secondary" 
            className="w-full py-4 rounded-3xl border border-blue-500/30 flex-row items-center"
          >
            <Gift color="#3b82f6" size={20} className="mr-2" />
            {t.shop?.prizeMarket || 'Prize Market'}
          </Button>
          <Button onClick={() => setScreen('GAME_BOARD')} className="w-full py-4 rounded-3xl">
            {t.eventDetails.enterBoard}
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};
