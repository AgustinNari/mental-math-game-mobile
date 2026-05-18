import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Card, Input, PrimaryButton, SegmentedControl } from '../components/Common';
import { MiniBarChart, MiniLineChart, MetricBadge } from '../components/Charts';
import { GameMode } from '../types';
import { theme } from '../theme';
import { getDifficultyLabel, getModeConfigKey } from '../utils/math';

type ViewMode = 'rankings' | 'stats';
type MaybeBool = 'all' | 'yes' | 'no';

const modeLabels: Record<'all' | GameMode, string> = {
  all: 'Todos',
  classic: 'Clásico',
  trueFalse: 'V/F',
  multipleChoice: 'Múltiple elección'
};

const difficultyLabels: Record<'all' | 'easy' | 'medium' | 'hard', string> = {
  all: 'Todas',
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil'
};

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '-';
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('es-AR');
}

export function StatsScreen() {
  const { profile, patchProfile } = useApp();
  const [view, setView] = useState<ViewMode>('rankings');
  const [modeFilter, setModeFilter] = useState<'all' | GameMode>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [timeAttackFilter, setTimeAttackFilter] = useState<MaybeBool>('all');
  const [dynamicFilter, setDynamicFilter] = useState<MaybeBool>('all');
  const [iterationsFilter, setIterationsFilter] = useState('all');

  if (!profile) return null;

  const rawIterations = Number(iterationsFilter);
  const normalizedIterations =
    iterationsFilter.trim().toLowerCase() === 'all' || Number.isNaN(rawIterations)
      ? null
      : Math.min(100, Math.max(1, rawIterations));

  const records = profile.records;

  const matches = (record: (typeof records)[number]) => {
    const matchesMode = modeFilter === 'all' || record.config.mode === modeFilter;
    const matchesDifficulty = difficultyFilter === 'all' || record.config.difficulty === difficultyFilter;
    const matchesTimeAttack =
      timeAttackFilter === 'all'
        ? true
        : timeAttackFilter === 'yes'
          ? record.config.timeAttack
          : !record.config.timeAttack;
    const matchesDynamic =
      dynamicFilter === 'all'
        ? true
        : dynamicFilter === 'yes'
          ? record.config.dynamicDifficulty
          : !record.config.dynamicDifficulty;
    const matchesIterations = normalizedIterations === null || record.config.iterations === normalizedIterations;
    return matchesMode && matchesDifficulty && matchesTimeAttack && matchesDynamic && matchesIterations;
  };

  const filtered = useMemo(() => records.filter(matches), [records, modeFilter, difficultyFilter, timeAttackFilter, dynamicFilter, normalizedIterations]);
  const globalTop = useMemo(() => [...records].sort((a, b) => b.score - a.score).slice(0, 10), [records]);
  const filteredTop = useMemo(() => [...filtered].sort((a, b) => b.score - a.score).slice(0, 5), [filtered]);

  const stats = useMemo(() => {
    const total = records.length;
    const best = total ? Math.max(...records.map((r) => r.score)) : 0;
    const avgScore = total ? records.reduce((acc, r) => acc + r.score, 0) / total : 0;
    const avgAccuracy = total ? records.reduce((acc, r) => acc + r.accuracy, 0) / total : 0;
    const avgResponse = total ? records.reduce((acc, r) => acc + r.avgResponseMs, 0) / total : 0;
    const correct = records.reduce((acc, r) => acc + r.correct, 0);
    const incorrect = records.reduce((acc, r) => acc + r.incorrect, 0);
    const timeouts = records.reduce((acc, r) => acc + r.timeouts, 0);
    const playTime = records.reduce((acc, r) => acc + r.durationMs, 0);
    return { total, best, avgScore, avgAccuracy, avgResponse, correct, incorrect, timeouts, playTime };
  }, [records]);

  const scoreTrend = useMemo(() => [...records].slice(0, 8).reverse().map((r) => r.score), [records]);
  const byMode = useMemo(() => ['classic', 'trueFalse', 'multipleChoice'].map((mode) => records.filter((r) => r.config.mode === mode).length), [records]);
  const avgByDifficulty = useMemo(
    () => ['easy', 'medium', 'hard'].map((difficulty) => {
      const list = records.filter((r) => r.config.difficulty === difficulty);
      return list.length ? list.reduce((acc, r) => acc + r.score, 0) / list.length : 0;
    }),
    [records]
  );

  const resetFilters = () => {
    setModeFilter('all');
    setDifficultyFilter('all');
    setTimeAttackFilter('all');
    setDynamicFilter('all');
    setIterationsFilter('all');
  };

  const removeRecord = (id: string) => {
    Alert.alert('Eliminar partida', '¿Querés borrar esta partida?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          patchProfile((current) => ({
            ...current,
            records: current.records.filter((record) => record.id !== id)
          }));
        }
      }
    ]);
  };

  const removeFiltered = () => {
    Alert.alert('Eliminar filtrados', 'Se borrarán todas las partidas que coincidan con los filtros actuales.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          patchProfile((current) => ({
            ...current,
            records: current.records.filter((record) => !matches(record))
          }));
        }
      }
    ]);
  };

  const clearAll = () => {
    Alert.alert('Eliminar todo el historial', '¿Borramos todas las partidas guardadas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          patchProfile((current) => ({ ...current, records: [] }));
        }
      }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
      <Card>
        <SegmentedControl
          value={view}
          options={[
            { label: 'Ranking', value: 'rankings' },
            { label: 'Estadísticas', value: 'stats' }
          ]}
          onChange={setView}
        />
      </Card>

      {view === 'rankings' ? (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Filtros</Text>
            <Text style={styles.filterLabel}>Modo</Text>
            <SegmentedControl
              value={modeFilter}
              options={[
                { label: 'Todos', value: 'all' },
                { label: 'Clásico', value: 'classic' },
                { label: 'V/F', value: 'trueFalse' },
                { label: 'Mult.', value: 'multipleChoice' }
              ]}
              onChange={setModeFilter}
            />
            <Text style={styles.filterLabel}>Dificultad</Text>
            <SegmentedControl
              value={difficultyFilter}
              options={[
                { label: 'Todas', value: 'all' },
                { label: 'Fácil', value: 'easy' },
                { label: 'Media', value: 'medium' },
                { label: 'Difícil', value: 'hard' }
              ]}
              onChange={setDifficultyFilter}
            />
            <Text style={styles.filterLabel}>Contrarreloj</Text>
            <SegmentedControl
              value={timeAttackFilter}
              options={[
                { label: 'Todas', value: 'all' },
                { label: 'Sí', value: 'yes' },
                { label: 'No', value: 'no' }
              ]}
              onChange={setTimeAttackFilter}
            />
            <Text style={styles.filterLabel}>Dinámica</Text>
            <SegmentedControl
              value={dynamicFilter}
              options={[
                { label: 'Todas', value: 'all' },
                { label: 'Sí', value: 'yes' },
                { label: 'No', value: 'no' }
              ]}
              onChange={setDynamicFilter}
            />
            <Text style={styles.filterLabel}>Iteraciones exactas</Text>
            <Input value={iterationsFilter} onChangeText={setIterationsFilter} placeholder="all o 10" keyboardType="number-pad" />
            <View style={styles.doubleButtons}>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Reset filtros" onPress={resetFilters} tone="ghost" />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Borrar filtrados" onPress={removeFiltered} tone="danger" />
              </View>
            </View>
            <PrimaryButton title="Borrar todo" onPress={clearAll} tone="danger" />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Top 5 según el filtro</Text>
            {filteredTop.length === 0 ? (
              <Text style={styles.empty}>No hay partidas para esos filtros.</Text>
            ) : (
              filteredTop.map((record, index) => (
                <View key={record.id} style={styles.recordRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle}>
                      #{index + 1} · {record.score} pts
                    </Text>
                    <Text style={styles.recordMeta}>{getModeConfigKey(record.config)}</Text>
                    <Text style={styles.recordMeta}>
                      {formatDate(record.createdAt)} · Precisión {record.accuracy.toFixed(1)}% · Promedio {formatMs(record.avgResponseMs)}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeRecord(record.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>Borrar</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ranking global top 10</Text>
            {globalTop.length === 0 ? (
              <Text style={styles.empty}>Todavía no hay partidas guardadas.</Text>
            ) : (
              globalTop.map((record, index) => (
                <View key={record.id} style={styles.recordRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle}>
                      #{index + 1} · {record.score} pts
                    </Text>
                    <Text style={styles.recordMeta}>
                      {modeLabels[record.config.mode]} · {getDifficultyLabel(record.config.difficulty)} · {record.config.iterations} iteraciones
                    </Text>
                    <Text style={styles.recordMeta}>
                      {record.config.timeAttack ? 'Contrarreloj' : 'Normal'} · {record.config.dynamicDifficulty ? 'Dinámica' : 'Fija'}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeRecord(record.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>Borrar</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Resumen general</Text>
            <View style={styles.metricGrid}>
              <MetricBadge label="Partidas" value={stats.total} />
              <MetricBadge label="Mejor puntaje" value={stats.best} />
              <MetricBadge label="Puntaje medio" value={Math.round(stats.avgScore)} />
              <MetricBadge label="Precisión media" value={`${stats.avgAccuracy.toFixed(1)}%`} />
              <MetricBadge label="Promedio resp." value={formatMs(stats.avgResponse)} />
              <MetricBadge label="Duración total" value={`${(stats.playTime / 60000).toFixed(1)} min`} />
              <MetricBadge label="Aciertos" value={stats.correct} />
              <MetricBadge label="Errores" value={stats.incorrect} />
              <MetricBadge label="Sin respuesta" value={stats.timeouts} />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Puntaje de las últimas partidas</Text>
            <MiniLineChart values={scoreTrend.length ? scoreTrend : [0]} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Cantidad de partidas por modo</Text>
            <MiniBarChart values={byMode} labels={['Clásico', 'V/F', 'Mult.']} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Puntaje promedio por dificultad</Text>
            <MiniBarChart values={avgByDifficulty} labels={['Fácil', 'Media', 'Dif.']} />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12
  },
  filterLabel: {
    color: theme.colors.muted,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '700'
  },
  empty: {
    color: theme.colors.muted
  },
  recordRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  recordTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  recordMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 3
  },
  deleteBtn: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12
  },
  deleteBtnText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 12
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  doubleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  }
});
