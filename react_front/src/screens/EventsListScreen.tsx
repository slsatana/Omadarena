import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useGame } from '../context/GameContext';
import { ScreenWrapper } from '../components/Shared';
import { User, Flame, Rocket, ShieldCheck, ArrowUpDown, GitCommit, Layers, Sparkles, FlaskConical, Puzzle, Gamepad2 } from 'lucide-react-native';

export const EventsListScreen = () => {
  const { setScreen, setSelectedGameId, t, user, gamesStats } = useGame();
  
  const staticArenas = [
    { 
      id: 1, gameId: 'ARENA_RUNNER', title: t.gameDetails?.ARENA_RUNNER?.title || 'Arena Runner', status: t.events.active, 
      icon: <Flame color="#3b82f6" size={28} />, color: "bg-blue-500/10", date: "3d",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400"
    },
    { 
      id: 2, gameId: 'NEON_JUMP', title: t.gameDetails?.NEON_JUMP?.title || 'Neon Jump', status: t.events.active, 
      icon: <Rocket color="#06b6d4" size={28} />, color: "bg-cyan-500/10", date: "5d", 
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 3, gameId: 'CYBER_SHIELD', title: t.gameDetails?.CYBER_SHIELD?.title || 'Cyber Shield', status: t.events.active, 
      icon: <ShieldCheck color="#ec4899" size={28} />, color: "bg-pink-500/10", date: "End", 
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 4, gameId: 'HIGHER_LOWER', title: t.higherLower?.title || "Higher Lower", status: t.events.active, 
      icon: <ArrowUpDown color="#f97316" size={28} />, color: "bg-orange-500/10", date: "New", 
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 8, gameId: 'SNAKE', title: t.snake?.title || "Snake", status: t.events.active, 
      icon: <GitCommit color="#3b82f6" size={28} />, color: "bg-blue-500/10", date: "New", 
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 9, gameId: 'SKY_STACK', title: t.skyStack?.title || "Sky Stack", status: t.events.active, 
      icon: <Layers color="#eab308" size={28} />, color: "bg-yellow-500/10", date: "New", 
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 10, gameId: 'MATCH3', title: t.gameDetails?.MATCH3?.title || "Match 3", status: t.events.active, 
      icon: <Sparkles color="#a855f7" size={28} />, color: "bg-purple-500/10", date: "New", 
      image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 11, gameId: 'COLOR_SORT', title: t.colorSort?.title || "Color Sort", status: t.events.active, 
      icon: <FlaskConical color="#ec4899" size={28} />, color: "bg-pink-500/10", date: "New", 
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400" 
    },
    { 
      id: 12, gameId: 'TETRIS', title: t.gameDetails?.TETRIS?.title || "Tetris", status: t.events.active, 
      icon: <Puzzle color="#06b6d4" size={28} />, color: "bg-cyan-500/10", date: "New", 
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400" 
    }
  ];

  const activeGamesList = Object.values(gamesStats) as any[];
  
  let arenas = activeGamesList.map((stat, index) => {
      const staticTemplate = staticArenas.find(a => a.gameId === stat.id);
      return {
         id: index + 100,
         gameId: stat.id,
         title: stat.displayName || staticTemplate?.title || stat.name || stat.id,
         status: t.events.active,
         icon: staticTemplate?.icon || <Gamepad2 color="#3b82f6" size={28} />,
         color: staticTemplate?.color || "bg-blue-500/10",
         date: staticTemplate?.date || "New",
         image: stat.imageUrl || staticTemplate?.image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400"
      };
  });

  if (arenas.length === 0) arenas = staticArenas;

  return (
    <ScreenWrapper className="p-6 pt-12 flex-1">
      <View className="flex-row justify-between items-end mb-6">
        <View className="flex-col">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t.events.playerProfile}</Text>
          <Text className="text-white text-xl font-extrabold tracking-tight">{user.name}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setScreen('PROFILE')} 
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center"
        >
          <User color="#a1a1aa" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <Text className="text-white text-lg font-bold tracking-tight">{t.events.title}</Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {arenas.filter(a => a.status !== t.events.comingSoon).map((arena) => (
            <TouchableOpacity
              key={arena.id}
              activeOpacity={0.8}
              onPress={() => {
                if (arena.status === t.events.active) {
                  setSelectedGameId(arena.gameId);
                  setScreen('EVENT_DETAILS');
                }
              }}
              className="w-[48%] mb-6 flex-col items-center"
            >
              <View className="relative w-full aspect-[4/4.5] rounded-3xl overflow-hidden border border-blue-500/30 bg-zinc-900 mb-2">
                <Image 
                  source={{ uri: arena.image }} 
                  className="absolute inset-0 w-full h-full opacity-80"
                />
                <View className="absolute bottom-4 w-full flex-row justify-center z-10">
                  <View className={`w-12 h-12 rounded-xl ${arena.color} items-center justify-center border border-white/10`}>
                    {arena.icon}
                  </View>
                </View>
                {arena.status === t.events.active && (
                  <View className="absolute top-3 right-3 w-3 h-3 rounded-full bg-blue-500" />
                )}
              </View>
              <Text className="text-white text-xs font-bold text-center tracking-tight">{arena.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-20" />
      </ScrollView>
    </ScreenWrapper>
  );
};
