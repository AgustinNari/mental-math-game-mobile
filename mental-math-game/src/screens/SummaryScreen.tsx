import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Card, PrimaryButton, SegmentedControl } from '../components/Common';
import { MiniBarChart, MetricBadge } from '../components/Charts';
import { theme } from '../theme';
import { formatNumber, getDifficultyLabel, getQuestionLabel } from '../utils/math';

type SummaryTab = 'resumen' | 'detalle';

export function SummaryScreen() {
  const { lastRecord, setScreen, setActiveTab, startGame } = useApp();
  const [tab, setTab] = useState<SummaryTab>('resumen');

  const record = lastRecord;
  const chartValues = useMemo(() => {
    if (!record) return [0, 0, 0];
    return [record.correct, record.incorrect, record.timeouts];
  }, [record]);

  if (!record) {
    return (
      <Card>
        <Text style={styles.title}>No hay una partida reciente para mostrar.</Text>
        <PrimaryButton title="Volver al inicio" onPress={() => setScreen('main')} />
      </Card>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 56, paddingBottom: 30 }}>
      <Card>
        <Text style={styles.title}>Resumen final</Text>
        <Text style={styles.meta}>
          {getQuestionLabel(record.config.mode)} · {getDifficultyLabel(record.config.difficulty)}
        </Text>
        <Text style={styles.meta}>
          {record.config.timeAttack ? 'Contrarreloj' : 'Normal'} · {record.config.dynamicDifficulty ? 'Dinámica' : 'Fija'} · {record.config.iterations} preguntas
        </Text>

        <View style={styles.metricsRow}>
          <MetricBadge label="Puntaje" value={record.score} />
          <MetricBadge label="Aciertos" value={record.correct} />
          <MetricBadge label="Precisión" value={`${record.accuracy.toFixed(1)}%`} />
          <MetricBadge label="Prom. respuesta" value={`${(record.avgResponseMs / 1000).toFixed(2)} s`} />
        </View>

        <View style={styles.metricsRow}>
          <MetricBadge label="Errores" value={record.incorrect} />
          <MetricBadge label="Sin respuesta" value={record.timeouts} />
          <MetricBadge label="Más rápida" value={`${(record.fastestResponseMs / 1000).toFixed(2)} s`} />
          <MetricBadge label="Más lenta" value={`${(record.slowestResponseMs / 1000).toFixed(2)} s`} />
        </View>

        <Text style={styles.meta}>Duración total: {(record.durationMs / 1000).toFixed(1)} s</Text>
      </Card>

      <Card>
        <SegmentedControl
          value={tab}
          options={[
            { label: 'Resumen', value: 'resumen' },
            { label: 'Detalle', value: 'detalle' }
          ]}
          onChange={setTab}
        />
        {tab === 'resumen' ? (
          <>
            <Text style={styles.section}>Distribución de resultados</Text>
            <MiniBarChart values={chartValues} labels={['Bien', 'Mal', 'N/R']} />
            <Text style={styles.note}>
              La puntuación combina velocidad, precisión y bonificaciones por dificultad, modo, iteraciones y toggles activos.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.section}>Detalle de preguntas</Text>
            {record.answers.map((item) => (
              <View key={`${item.questionId}-${item.questionIndex}`} style={styles.answerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.answerTitle}>
                    #{item.questionIndex} · {item.isCorrect ? 'Correcta' : item.timedOut ? 'Sin respuesta' : 'Incorrecta'}
                  </Text>
                  <Text style={styles.answerMeta}>{item.expression}</Text>
                  <Text style={styles.answerMeta}>
                    Respuesta: {item.userAnswer ?? '—'} · Esperado: {formatNumber(item.expectedAnswer)}
                  </Text>
                  <Text style={styles.answerMeta}>
                    Tiempo: {item.responseMs !== null ? `${(item.responseMs / 1000).toFixed(2)} s` : '—'} · Puntos: {item.awardedPoints}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </Card>

      <Card>
        <PrimaryButton title="Jugar otra vez" onPress={startGame} />
        <PrimaryButton
          title="Ir a configuración de partida"
          onPress={() => {
            setActiveTab('gameConfig');
            setScreen('main');
          }}
          tone="ghost"
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6
  },
  meta: {
    color: theme.colors.muted,
    marginBottom: 4
  },
  section: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 12
  },
  note: {
    color: theme.colors.muted,
    marginTop: 10,
    lineHeight: 20
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  answerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  answerTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 4
  },
  answerMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2
  }
});
