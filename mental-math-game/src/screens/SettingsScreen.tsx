import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Card, PrimaryButton, ToggleRow } from '../components/Common';
import { theme } from '../theme';

export function SettingsScreen() {
  const { profile, updateSettings, logout, deleteCurrentProfile } = useApp();

  if (!profile) return null;

  const settings = profile.settings;

  const toggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ ...settings, [key]: value });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar perfil',
      'Se borrarán todos los récords y estadísticas de este perfil. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCurrentProfile();
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={styles.title}>Configuración general</Text>
        <ToggleRow
          label="Sonidos"
          value={settings.soundEnabled}
          onToggle={(next) => toggle('soundEnabled', next)}
          description="Sonidos de acierto, error, inicio y fin de partida."
        />
        <ToggleRow
          label="Música de fondo"
          value={settings.musicEnabled}
          onToggle={(next) => toggle('musicEnabled', next)}
          description="La música acelera suavemente cuando queda menos tiempo."
        />
        <ToggleRow
          label="Vibración"
          value={settings.hapticsEnabled}
          onToggle={(next) => toggle('hapticsEnabled', next)}
          description="Retroalimentación háptica al responder bien o mal."
        />
      </Card>

      <Card>
        <Text style={styles.title}>Perfil actual</Text>
        <Text style={styles.info}>Nombre: {profile.name}</Text>
        <Text style={styles.info}>Partidas guardadas: {profile.records.length}</Text>
        <Text style={styles.info}>
          Fecha de alta: {new Date(profile.createdAt).toLocaleDateString('es-AR')}
        </Text>

        <PrimaryButton title="Cerrar sesión" onPress={logout} tone="ghost" />
        <PrimaryButton title="Eliminar perfil actual" onPress={confirmDelete} tone="danger" />
      </Card>

      <Card>
        <Text style={styles.noteTitle}>Notas de uso</Text>
        <Text style={styles.note}>
          • Todo queda guardado localmente en este dispositivo.{"\n"}
          • La pantalla central contiene la configuración de partida.{"\n"}
          • La pantalla derecha muestra rankings y estadísticas con filtros.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: theme.space.sm
  },
  info: {
    color: theme.colors.muted,
    marginBottom: 4
  },
  noteTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8
  },
  note: {
    color: theme.colors.muted,
    lineHeight: 20
  }
});
