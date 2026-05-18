import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function MiniBarChart({
  values,
  labels,
  height = 140
}: {
  values: number[];
  labels: string[];
  height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <View style={[styles.chart, { height }]}>
      <View style={styles.barsRow}>
        {values.map((value, index) => {
          const barHeight = `${Math.max(6, (value / max) * 100)}%`;
          return (
            <View key={`${labels[index]}-${index}`} style={styles.barGroup}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barHeight }]} />
              </View>
              <Text style={styles.barLabel}>{labels[index]}</Text>
              <Text style={styles.barValue}>{Math.round(value)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function MiniLineChart({
  values,
  height = 150
}: {
  values: number[];
  height?: number;
}) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  return (
    <View style={[styles.chart, { height }]}>
      <View style={styles.lineWrap}>
        {values.map((value, index) => {
          const normalized = (value - min) / Math.max(1, max - min);
          return (
            <View key={`${index}-${value}`} style={styles.linePointWrap}>
              <View style={[styles.linePoint, { bottom: `${10 + normalized * 70}%` }]} />
              {index < values.length - 1 ? <View style={styles.lineSegment} /> : null}
              <Text style={styles.lineLabel}>{index + 1}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.lineBase} />
    </View>
  );
}

export function MetricBadge({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.metricBadge}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    backgroundColor: theme.colors.bgSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.md,
    marginBottom: theme.space.md
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around'
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  barTrack: {
    width: 24,
    flex: 1,
    minHeight: 60,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardAlt,
    justifyContent: 'flex-end'
  },
  barFill: {
    width: '100%',
    backgroundColor: theme.colors.primary
  },
  barLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  barValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800'
  },
  lineWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    position: 'relative'
  },
  linePointWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%'
  },
  linePoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.primary
  },
  lineSegment: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    top: '50%',
    height: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.55
  },
  lineLabel: {
    position: 'absolute',
    bottom: 0,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  lineBase: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 32,
    height: 2,
    backgroundColor: theme.colors.border
  },
  metricBadge: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4
  }
});
