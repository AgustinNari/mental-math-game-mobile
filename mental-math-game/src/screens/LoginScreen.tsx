import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Card, Input, PrimaryButton, ScreenShell, SectionTitle } from '../components/Common';
import { theme } from '../theme';

export function LoginScreen() {
  const { profileNames, login } = useApp();
  const [name, setName] = useState('');

  const sortedProfiles = useMemo(() => [...profileNames].sort((a, b) => a.localeCompare(b, 'es')), [profileNames]);

  const handleLogin = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      Alert.alert('Nombre requerido', 'Ingresá un nombre de perfil para continuar.');
      return;
    }
    await login(trimmed);
    setName('');
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="Juego de Cálculos Mentales"
        subtitle="Ingresá con un perfil local para conservar récords, estadísticas y configuración."
      />

      <Card>
        <Text style={styles.label}>Nombre del perfil</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Ej: Juan"
          keyboardType="default"
        />
        <PrimaryButton title="Entrar / crear perfil" onPress={() => handleLogin(name)} />
      </Card>

      <Card style={{ flex: 1 }}>
        <Text style={styles.label}>Perfiles guardados</Text>
        {sortedProfiles.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay perfiles creados.</Text>
        ) : (
          <FlatList
            data={sortedProfiles}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleLogin(item)} style={styles.profileRow}>
                <Text style={styles.profileName}>{item}</Text>
                <Text style={styles.profileHint}>Tocá para ingresar</Text>
              </Pressable>
            )}
          />
        )}
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10
  },
  empty: {
    color: theme.colors.muted,
    marginTop: 10
  },
  profileRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  profileName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  profileHint: {
    color: theme.colors.muted,
    marginTop: 4,
    fontSize: 12
  }
});
