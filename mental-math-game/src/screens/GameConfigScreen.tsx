import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Card, PrimaryButton, SegmentedControl, Stepper, ToggleRow } from '../components/Common';
import { GameConfig } from '../types';
import { theme } from '../theme';

export function GameConfigScreen() {
  const { profile, updateGameConfig, startGame } = useApp();

  if (!profile) return null;
  const config = profile.gameConfig;

  const update = async (next: Partial<GameConfig>) => {
    const merged = { ...config, ...next };

    if (merged.timeAttack && merged.dynamicDifficulty) {
      if ('timeAttack' in next && next.timeAttack) {
        merged.dynamicDifficulty = false;
      } else if ('dynamicDifficulty' in next && next.dynamicDifficulty) {
        merged.timeAttack = false;
      } else {
        merged.dynamicDifficulty = false;
      }
    }

    await updateGameConfig(merged);
  };

  const handlePlay = () => {
    if (config.iterations < 1 || config.iterations > 100) {
      Alert.alert('Iteraciones inválidas', 'La cantidad de iteraciones debe estar entre 1 y 100.');
      return;
    }
    startGame();
  };

  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={styles.title}>Modo de juego</Text>
        <SegmentedControl
          value={config.mode}
          options={[
            { label: 'Clásico', value: 'classic' },
            { label: 'V/F', value: 'trueFalse' },
            { label: 'Múltiple elección', value: 'multipleChoice' }
          ]}
          onChange={(mode) => update({ mode })}
        />
        <Text style={styles.title}>Dificultad</Text>
        <SegmentedControl
          value={config.difficulty}
          options={[
            { label: 'Fácil', value: 'easy' },
            { label: 'Media', value: 'medium' },
            { label: 'Difícil', value: 'hard' }
          ]}
          onChange={(difficulty) => update({ difficulty })}
        />
        <Text style={styles.title}>Cantidad de iteraciones</Text>
        <Stepper value={config.iterations} min={1} max={100} onChange={(iterations) => update({ iterations })} />
        <Text style={styles.hint}>Cada partida usa esta cantidad de preguntas.</Text>
      </Card>

      <Card>
        <Text style={styles.title}>Toggles de partida</Text>
        <ToggleRow
          label="Contrarreloj"
          value={config.timeAttack}
          onToggle={(next) => update({ timeAttack: next, dynamicDifficulty: next ? false : config.dynamicDifficulty })}
          description="Empieza con tiempo base y suma segundos por acierto. Es incompatible con dificultad dinámica."
        />
        <ToggleRow
          label="Dificultad dinámica"
          value={config.dynamicDifficulty}
          onToggle={(next) => update({ dynamicDifficulty: next, timeAttack: next ? false : config.timeAttack })}
          description="Reduce el tiempo por pregunta de forma lineal. Es incompatible con contrarreloj."
        />
      </Card>

      <Card>
        <Text style={styles.title}>Resumen actual</Text>
        <Text style={styles.info}>Modo: {config.mode === 'classic' ? 'Clásico' : config.mode === 'trueFalse' ? 'Verdadero / Falso' : 'Múltiple elección'}</Text>
        <Text style={styles.info}>Dificultad: {config.difficulty === 'easy' ? 'Fácil' : config.difficulty === 'medium' ? 'Media' : 'Difícil'}</Text>
        <Text style={styles.info}>Iteraciones: {config.iterations}</Text>
        <Text style={styles.info}>Contrarreloj: {config.timeAttack ? 'Sí' : 'No'}</Text>
        <Text style={styles.info}>Dinámica: {config.dynamicDifficulty ? 'Sí' : 'No'}</Text>
        <PrimaryButton title="Jugar" onPress={handlePlay} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 6
  },
  hint: {
    color: theme.colors.muted,
    marginTop: 8,
    fontSize: 12
  },
  info: {
    color: theme.colors.muted,
    marginBottom: 4
  }
});
