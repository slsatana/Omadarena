import { GameProvider, useGame } from './context/GameContext';
import { AnimatePresence } from 'motion/react';
import { 
  WelcomeScreen, 
  LoginScreen, 
  OnboardingScreen, 
  EventsListScreen, 
  EventDetailsScreen, 
  MainGameScreen, 
  PromoCodeScreen, 
  ResultScreen, 
  ProfileScreen,
  PrizeScannerScreen,
  VenueDashboard,
  AdminDashboard,
  LeaderboardScreen,
  ShopScreen,
  SettingsScreen,
  SupportScreen
} from './components/Screens';
import { MyPrizesScreen } from './components/MyPrizesScreen';

function AppContent() {
  const { screen } = useGame();

  return (
    <div className="bg-black min-h-screen flex justify-center w-full font-sans selection:bg-orange-500 selection:text-white relative">
      <div className="w-full sm:max-w-[430px] min-h-screen bg-zinc-950 shadow-2xl sm:border-x sm:border-zinc-800/50 relative overflow-x-hidden mx-auto [transform:translateZ(0)]">
        <AnimatePresence mode="wait">
          {screen === 'WELCOME' && <WelcomeScreen key="welcome" />}
          {screen === 'LOGIN' && <LoginScreen key="login" />}
          {screen === 'ONBOARDING' && <OnboardingScreen key="onboarding" />}
          {screen === 'EVENTS' && <EventsListScreen key="events" />}
          {screen === 'EVENT_DETAILS' && <EventDetailsScreen key="details" />}
          {screen === 'GAME_BOARD' && <MainGameScreen key="board" />}
          {screen === 'PROMO_CODE' && <PromoCodeScreen key="promo" />}
          {screen === 'RESULT' && <ResultScreen key="result" />}
          {screen === 'PROFILE' && <ProfileScreen key="profile" />}
          {screen === 'SETTINGS' && <SettingsScreen key="settings" />}
          {screen === 'SUPPORT' && <SupportScreen key="support" />}
          {screen === 'LEADERBOARD' && <LeaderboardScreen key="leaderboard" />}
          {screen === 'SHOP' && <ShopScreen key="shop" />}
          {screen === 'MY_PRIZES' && <MyPrizesScreen key="my_prizes" />}
          {screen === 'PRIZE_SCANNER' && <PrizeScannerScreen key="prize-qr" />}
          {screen === 'VENUE_DASHBOARD' && <VenueDashboard key="venue" />}
          {screen === 'ADMIN_DASHBOARD' && <AdminDashboard key="admin" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
