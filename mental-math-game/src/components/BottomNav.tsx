import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTab } from '../types';
import { theme } from '../theme';

const items: { key: MainTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'settings', label: 'Ajustes', icon: 'settings-outline' },
  { key: 'gameConfig', label: 'Juego', icon: 'game-controller-outline' },
  { key: 'stats', label: 'Ranking', icon: 'bar-chart-outline' }
];

export function BottomNav({
  active,
  onChange
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <Ionicons name={item.icon} size={22} color={isActive ? theme.colors.text : theme.colors.muted} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 8,
    paddingTop: 10
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6
  },
  itemActive: {
    opacity: 1
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  labelActive: {
    color: theme.colors.text
  }
});
