import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { ScreenWrapper, Button, BackButton, LanguageSwitcher } from '../components/Shared';
import { api } from '../api';

export const LoginScreen = () => {
  const { setScreen, t, loginWithPhone } = useGame();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (step === 'phone') {
      if (mode === 'REGISTER' && !displayName.trim()) {
        setError('Please enter your nickname');
        return;
      }
      if (phone.length < 13) {
        setError('Неверный формат номера');
        return;
      }
      try {
        setLoading(true);
        const res = await api.post('/auth/send-sms', { phone });
        if (res.data.isAdmin) setIsAdminLogin(true);
        setStep('code');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send SMS');
      } finally {
        setLoading(false);
      }
    } else {
      if (!isAdminLogin && code.length !== 6) {
        setError('Код должен состоять из 6 цифр');
        return;
      }
      setLoading(true);
      const success = await loginWithPhone(phone, code, mode === 'REGISTER' ? displayName : undefined);
      setLoading(false);
      if (!success) setError('Invalid Code');
    }
  };

  return (
    <ScreenWrapper className="p-6 pt-12 flex-1">
      <View className="flex-row justify-between mb-4">
        <BackButton onClick={() => setScreen('WELCOME')} />
        <LanguageSwitcher />
      </View>
      
      <View className="mb-8">
        <Text className="text-white text-3xl font-extrabold mb-1">
          {mode === 'REGISTER' ? t.login.signUp || 'Register' : t.login.title}
        </Text>
        <Text className="text-zinc-400 text-sm font-medium">
          {mode === 'REGISTER' ? 'Create a new account' : t.login.desc}
        </Text>
      </View>
      
      <View className="flex-1">
          {step === 'phone' ? (
          <View className="flex-col gap-4">
            {mode === 'REGISTER' && (
              <View>
                <Text className="text-xs font-semibold text-zinc-400 mb-1 ml-1">Nickname</Text>
                <TextInput 
                  placeholderTextColor="#71717a"
                  placeholder="PlayerOne"
                  value={displayName}
                  onChangeText={setDisplayName}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white text-base font-medium"
                />
              </View>
            )}
            <View>
              <Text className="text-xs font-semibold text-zinc-400 mb-1 ml-1">{t.login.phone}</Text>
              <TextInput 
                keyboardType="phone-pad"
                placeholderTextColor="#71717a"
                placeholder="+99890..."
                value={phone}
                onChangeText={(val) => {
                  let cleaned = val.replace(/[^\d+]/g, '');
                  if (!cleaned.startsWith('+998')) cleaned = '+998';
                  if (cleaned.length > 13) cleaned = cleaned.slice(0, 13);
                  setPhone(cleaned);
                }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white text-base font-medium"
              />
            </View>
          </View>
          ) : (
          <View>
            <Text className="text-xs font-semibold text-zinc-400 mb-1 ml-1">SMS Code</Text>
            <TextInput 
              keyboardType="number-pad"
              maxLength={isAdminLogin ? undefined : 6}
              placeholderTextColor="#71717a"
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white text-xl font-medium tracking-[8px] text-center"
            />
          </View>
          )}
          {error ? <Text className="text-red-500 text-sm font-semibold mt-2">{error}</Text> : null}
      </View>

      <View className="mt-6 mb-10">
        <Button onClick={handleLogin} disabled={loading} className="w-full py-4 text-base rounded-3xl">
          {loading ? 'Processing...' : step === 'phone' ? 'Send SMS' : (mode === 'REGISTER' ? 'Register Account' : t.login.signIn)}
        </Button>
        <View className="flex-row justify-center mt-4">
            <Text className="text-zinc-400 text-sm font-medium">
              {mode === 'LOGIN' ? t.login.noAccount : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setStep('phone'); setError(''); }}>
                <Text className="text-blue-500 font-bold ml-1 text-sm">
                  {mode === 'LOGIN' ? t.login.signUp : t.login.signIn}
                </Text>
            </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};
