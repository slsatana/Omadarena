import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper, Button } from '../components/Shared';
import { useGame } from '../context/GameContext';

// Import our native rewritten screens
export { WelcomeScreen } from './WelcomeScreen';
export { LoginScreen } from './LoginScreen';
export { OnboardingScreen } from './OnboardingScreen';
export { EventsListScreen } from './EventsListScreen';
export { EventDetailsScreen } from './EventDetailsScreen';
export { PromoCodeScreen, ResultScreen } from './RewardScreens';

// STUB COMPONENTS FOR REMAINING SECONDARY SCREENS
export const MainGameScreen = () => {
    const { setScreen } = useGame();
    return (
        <ScreenWrapper className="flex-1 justify-center items-center p-6">
            <Text className="text-white text-2xl font-bold mb-4">GAME BOARD</Text>
            <Text className="text-zinc-400 text-center mb-6">Games must be wrapped in react-native-webview</Text>
            <Button onClick={() => setScreen('RESULT')} className="w-full py-4 rounded-3xl">Finish Game</Button>
        </ScreenWrapper>
    )
}

export const ProfileScreen = () => {
    const { setScreen, logout } = useGame();
    return (
        <ScreenWrapper className="flex-1 justify-center items-center p-6">
            <Text className="text-white text-2xl font-bold mb-4">Profile Screen</Text>
            <Button onClick={() => setScreen('EVENTS')} className="w-full py-4 rounded-3xl mb-4">Back to Events</Button>
            <Button variant="secondary" onClick={() => logout()} className="w-full py-4 rounded-3xl">Log out</Button>
        </ScreenWrapper>
    )
}

export const SettingsScreen = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">Settings</Text><Button onClick={() => setScreen('PROFILE')}>Back</Button></ScreenWrapper> )}
export const SupportScreen = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">Support</Text><Button onClick={() => setScreen('PROFILE')}>Back</Button></ScreenWrapper> )}
export const LeaderboardScreen = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">Leaderboard</Text><Button onClick={() => setScreen('EVENTS')}>Back</Button></ScreenWrapper> )}
export const ShopScreen = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">Shop</Text><Button onClick={() => setScreen('EVENT_DETAILS')}>Back</Button></ScreenWrapper> )}
export const PrizeScannerScreen = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">QA Scanner</Text><Button onClick={() => setScreen('VENUE_DASHBOARD')}>Back</Button></ScreenWrapper> )}
export const VenueDashboard = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">Venue Admin</Text><Button onClick={() => setScreen('EVENTS')}>Back</Button></ScreenWrapper> )}
export const AdminDashboard = () => { const { setScreen } = useGame(); return ( <ScreenWrapper className="flex-1 justify-center p-6"><Text className="text-white mb-4">Super Admin</Text><Button onClick={() => setScreen('EVENTS')}>Back</Button></ScreenWrapper> )}
