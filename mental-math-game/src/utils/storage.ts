import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileData } from '../types';

const PROFILE_INDEX_KEY = '@mental_math/profiles';
const CURRENT_PROFILE_KEY = '@mental_math/current_profile';

const profileKey = (name: string) => `@mental_math/profile/${encodeURIComponent(name)}`;

export async function loadProfileNames(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PROFILE_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveProfileNames(names: string[]): Promise<void> {
  await AsyncStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(names));
}

export async function getCurrentProfileName(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_PROFILE_KEY);
}

export async function setCurrentProfileName(name: string | null): Promise<void> {
  if (name) {
    await AsyncStorage.setItem(CURRENT_PROFILE_KEY, name);
  } else {
    await AsyncStorage.removeItem(CURRENT_PROFILE_KEY);
  }
}

export async function loadProfile(name: string): Promise<ProfileData | null> {
  const raw = await AsyncStorage.getItem(profileKey(name));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProfileData;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: ProfileData): Promise<void> {
  await AsyncStorage.setItem(profileKey(profile.name), JSON.stringify(profile));
  const names = await loadProfileNames();
  if (!names.includes(profile.name)) {
    names.push(profile.name);
    names.sort((a, b) => a.localeCompare(b, 'es'));
    await saveProfileNames(names);
  }
}

export async function deleteProfile(name: string): Promise<void> {
  await AsyncStorage.removeItem(profileKey(name));
  const names = await loadProfileNames();
  const next = names.filter((item) => item !== name);
  await saveProfileNames(next);
  const current = await getCurrentProfileName();
  if (current === name) {
    await setCurrentProfileName(null);
  }
}
