import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './screens/LoginScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { GameConfigScreen } from './screens/GameConfigScreen';
import { StatsScreen } from './screens/StatsScreen';
import { GameScreen } from './screens/GameScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { BottomNav } from './components/BottomNav';
import { theme } from './theme';

function MainLayout() {
  const { screen, activeTab, setActiveTab } = useApp();

  if (screen === 'login') return <LoginScreen />;
  if (screen === 'game') return <GameScreen />;
  if (screen === 'summary') return <SummaryScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          {activeTab === 'settings' ? <SettingsScreen /> : null}
          {activeTab === 'gameConfig' ? <GameConfigScreen /> : null}
          {activeTab === 'stats' ? <StatsScreen /> : null}
        </View>
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

export default function AppRoot() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  content: {
    flex: 1
  }
});
