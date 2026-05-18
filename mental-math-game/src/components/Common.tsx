import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

export function ScreenShell({ children }: { children?: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children?: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  tone = 'primary'
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'success' | 'danger' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        toneStyles[tone],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  value,
  onToggle,
  description
}: {
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
  description?: string;
}) {
  return (
    <Pressable onPress={() => onToggle(!value)} style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <View style={[styles.togglePill, value ? styles.togglePillOn : styles.togglePillOff]}>
        <Text style={styles.togglePillText}>{value ? 'ON' : 'OFF'}</Text>
      </View>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segmentWrap}>
      {options.map((item) => {
        const active = value === item.value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepperBtn}>
        <Text style={styles.stepperBtnText}>−</Text>
      </Pressable>
      <View style={styles.stepperValueBox}>
        <Text style={styles.stepperValue}>{value}</Text>
      </View>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepperBtn}>
        <Text style={styles.stepperBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${safe * 100}%` }]} />
    </View>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default'
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'number-pad' | 'decimal-pad';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.muted}
      keyboardType={keyboardType}
      style={styles.input}
      autoCapitalize="none"
      autoCorrect={false}
      selectionColor={theme.colors.primary}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.space.lg,
    paddingTop: 56
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    marginBottom: theme.space.md
  },
  sectionHeader: {
    marginBottom: theme.space.md
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4
  },
  sectionSubtitle: {
    color: theme.colors.muted,
    fontSize: 13
  },
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }]
  },
  primary: {
    backgroundColor: theme.colors.primarySoft
  },
  success: {
    backgroundColor: theme.colors.success
  },
  danger: {
    backgroundColor: theme.colors.danger
  },
  ghost: {
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  toggleDescription: {
    color: theme.colors.muted,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17
  },
  togglePill: {
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center'
  },
  togglePillOn: {
    backgroundColor: theme.colors.success
  },
  togglePillOff: {
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  togglePillText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 12
  },
  segmentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.bgSoft,
    borderRadius: theme.radius.md,
    padding: 4,
    marginBottom: theme.space.md
  },
  segmentItem: {
    flexGrow: 1,
    flexBasis: '33.33%',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: theme.radius.sm
  },
  segmentItemActive: {
    backgroundColor: theme.colors.primarySoft
  },
  segmentText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 13
  },
  segmentTextActive: {
    color: theme.colors.text
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10
  },
  stepperBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  stepperBtnText: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2
  },
  stepperValueBox: {
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.bgSoft,
    alignItems: 'center'
  },
  stepperValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.colors.cardAlt,
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary
  },
  input: {
    backgroundColor: theme.colors.bgSoft,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16
  }
});

const toneStyles = StyleSheet.create({
  primary: styles.primary,
  success: styles.success,
  danger: styles.danger,
  ghost: styles.ghost
});
