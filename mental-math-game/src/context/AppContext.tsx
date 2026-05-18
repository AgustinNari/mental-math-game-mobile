import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppScreen,
  AppSettings,
  GameConfig,
  GameRecord,
  MainTab,
  ProfileData
} from '../types';
import {
  deleteProfile,
  getCurrentProfileName,
  loadProfile,
  loadProfileNames,
  saveProfile,
  setCurrentProfileName
} from '../utils/storage';

const defaultSettings: AppSettings = {
  soundEnabled: true,
  musicEnabled: false,
  hapticsEnabled: true
};

const defaultGameConfig: GameConfig = {
  mode: 'classic',
  difficulty: 'easy',
  iterations: 10,
  timeAttack: false,
  dynamicDifficulty: false
};

interface AppContextValue {
  ready: boolean;
  screen: AppScreen;
  activeTab: MainTab;
  profileNames: string[];
  profile: ProfileData | null;
  lastRecord: GameRecord | null;
  login: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteCurrentProfile: () => Promise<void>;
  setActiveTab: (tab: MainTab) => void;
  setScreen: (screen: AppScreen) => void;
  updateSettings: (settings: AppSettings) => Promise<void>;
  updateGameConfig: (config: GameConfig) => Promise<void>;
  patchProfile: (updater: (current: ProfileData) => ProfileData) => void;
  startGame: () => void;
  finishGame: (record: GameRecord) => Promise<void>;
  cancelGame: () => void;
  reloadProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('login');
  const [activeTab, setActiveTab] = useState<MainTab>('gameConfig');
  const [profileNames, setProfileNames] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [lastRecord, setLastRecord] = useState<GameRecord | null>(null);

  const loadInitial = async () => {
    const names = await loadProfileNames();
    setProfileNames(names);
    const currentName = await getCurrentProfileName();
    if (currentName) {
      const loaded = await loadProfile(currentName);
      if (loaded) {
        setProfile(loaded);
        setScreen('main');
      } else {
        await setCurrentProfileName(null);
        setProfile(null);
        setScreen('login');
      }
    } else {
      setProfile(null);
      setScreen('login');
    }
    setReady(true);
  };

  useEffect(() => {
    loadInitial().catch(() => setReady(true));
  }, []);

  useEffect(() => {
    const save = async () => {
      if (profile) {
        await saveProfile(profile);
      }
      const names = await loadProfileNames();
      setProfileNames(names);
    };

    if (!ready || !profile) return;
    save().catch(() => undefined);
  }, [profile, ready]);

  const login = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = await loadProfile(trimmed);
    if (existing) {
      const next = { ...existing, lastLoginAt: Date.now() };
      setProfile(next);
      setScreen('main');
      setActiveTab('gameConfig');
      await setCurrentProfileName(trimmed);
      await saveProfile(next);
      return;
    }

    const newProfile: ProfileData = {
      name: trimmed,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      settings: defaultSettings,
      gameConfig: defaultGameConfig,
      records: []
    };
    setProfile(newProfile);
    setScreen('main');
    setActiveTab('gameConfig');
    await setCurrentProfileName(trimmed);
    await saveProfile(newProfile);
  };

  const logout = async () => {
    setProfile(null);
    setLastRecord(null);
    setScreen('login');
    setActiveTab('gameConfig');
    await setCurrentProfileName(null);
  };

  const deleteCurrentProfile = async () => {
    if (!profile) return;
    await deleteProfile(profile.name);
    setProfile(null);
    setLastRecord(null);
    setScreen('login');
    setActiveTab('gameConfig');
    setProfileNames(await loadProfileNames());
  };

  const updateSettings = async (settings: AppSettings) => {
    setProfile((current) => (current ? { ...current, settings } : current));
  };

  const updateGameConfig = async (config: GameConfig) => {
    setProfile((current) => (current ? { ...current, gameConfig: config } : current));
  };

  const patchProfile = (updater: (current: ProfileData) => ProfileData) => {
    setProfile((current) => (current ? updater(current) : current));
  };

  const startGame = () => {
    setLastRecord(null);
    setScreen('game');
  };

  const cancelGame = () => {
    setScreen('main');
  };

  const finishGame = async (record: GameRecord) => {
    setLastRecord(record);
    setProfile((current) => {
      if (!current) return current;
      const records = [record, ...current.records].slice(0, 500);
      return { ...current, records };
    });
    setScreen('summary');
  };

  const reloadProfile = async () => {
    if (!profile) return;
    const loaded = await loadProfile(profile.name);
    if (loaded) {
      setProfile(loaded);
    }
  };

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      screen,
      activeTab,
      profileNames,
      profile,
      lastRecord,
      login,
      logout,
      deleteCurrentProfile,
      setActiveTab,
      setScreen,
      updateSettings,
      updateGameConfig,
      patchProfile,
      startGame,
      finishGame,
      cancelGame,
      reloadProfile
    }),
    [ready, screen, activeTab, profileNames, profile, lastRecord]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
