import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Card, PrimaryButton, ProgressBar, ScreenShell } from '../components/Common';
import { theme } from '../theme';
import {
  buildQuestion,
  formatNumber,
  getDifficultyLabel,
  getModeConfigKey,
  getQuestionLabel,
  isAnswerCorrect,
  normalizeNumericInput
} from '../utils/math';
import {
  calculatePoints,
  getBaseQuestionTimeSec,
  getInitialTimeAttackSeconds,
  getLivesByDifficulty,
  getTimeAttackPenaltySeconds,
  getTimeAttackRewardSeconds,
  getTimeAttackTimeoutPenaltySeconds
} from '../utils/scoring';
import { AnswerRecord, GameRecord, Question } from '../types';

declare const require: (path: string) => number;

const SOUND = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  start: require('../../assets/sounds/start.wav'),
  end: require('../../assets/sounds/end.wav'),
  music: require('../../assets/music/loop.wav')
};

export function GameScreen() {
  const { profile, finishGame, cancelGame } = useApp();

  const config = profile?.gameConfig;
  const settings = profile?.settings;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [timeouts, setTimeouts] = useState(0);
  const [lives, setLives] = useState(0);
  const [input, setInput] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [displayQuestionTime, setDisplayQuestionTime] = useState(0);
  const [displaySessionTime, setDisplaySessionTime] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const questionLimitRef = useRef<number>(0);
  const sessionTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const questionLockedRef = useRef(false);
  const endedRef = useRef(false);
  const scoreRef = useRef(0);
  const recordsRef = useRef<AnswerRecord[]>([]);
  const musicSoundRef = useRef<Audio.Sound | null>(null);
  const livesRef = useRef(0);

  const currentQuestion = questions[index];
  const timeAttackMax = useMemo(() => {
    if (!config) return 0;
    return getInitialTimeAttackSeconds(config.difficulty) + config.iterations * getTimeAttackRewardSeconds();
  }, [config]);

  const loadMusic = async () => {
    if (!settings?.soundEnabled || !settings.musicEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(SOUND.music, {
        isLooping: true,
        shouldPlay: true,
        volume: 0.22
      });
      musicSoundRef.current = sound;
    } catch {
      // ignore
    }
  };

  const unloadMusic = async () => {
    const sound = musicSoundRef.current;
    musicSoundRef.current = null;
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        // ignore
      }
    }
  };

  const playSfx = async (asset: number) => {
    if (!settings?.soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true, volume: 0.9 });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => undefined);
        }
      });
    } catch {
      // ignore
    }
  };

  const haptic = async (kind: 'success' | 'error' | 'light') => {
    if (!settings?.hapticsEnabled) return;
    try {
      if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (kind === 'error') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  const endSession = async (finalRecords: AnswerRecord[]) => {
    if (!config || !profile || endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const endedAt = Date.now();
    const correctCount = finalRecords.filter((item) => item.isCorrect).length;
    const incorrectCount = finalRecords.filter((item) => !item.isCorrect && !item.timedOut).length;
    const timeoutCount = finalRecords.filter((item) => item.timedOut).length;
    const responseTimes = finalRecords.map((item) => item.responseMs).filter((value): value is number => value !== null);
    const avgResponseMs = responseTimes.length
      ? responseTimes.reduce((acc, value) => acc + value, 0) / responseTimes.length
      : 0;
    const fastestResponseMs = responseTimes.length ? Math.min(...responseTimes) : 0;
    const slowestResponseMs = responseTimes.length ? Math.max(...responseTimes) : 0;
    const durationMs = endedAt - sessionStartRef.current;
    const accuracy = finalRecords.length ? (correctCount / finalRecords.length) * 100 : 0;

    const record: GameRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: sessionStartRef.current,
      endedAt,
      config,
      score: scoreRef.current,
      correct: correctCount,
      incorrect: incorrectCount,
      timeouts: timeoutCount,
      accuracy,
      avgResponseMs,
      fastestResponseMs,
      slowestResponseMs,
      durationMs,
      answers: finalRecords
    };

    await playSfx(SOUND.end);
    await haptic('light');
    await unloadMusic();
    await finishGame(record);
  };

  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!config) return;

    const generated = Array.from({ length: config.iterations }, (_, questionIndex) =>
      buildQuestion(config, questionIndex)
    );

    const firstTime = generated[0]?.timeLimitSec ?? getBaseQuestionTimeSec(config.difficulty, config.mode);

    setQuestions(generated);
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setIncorrect(0);
    setTimeouts(0);
    const initialLives = config.timeAttack ? 0 : getLivesByDifficulty(config.difficulty);
    setLives(initialLives);
    livesRef.current = initialLives;
    setInput('');
    setSelectedChoice(null);
    setFeedback(null);
    setDisplayQuestionTime(firstTime);
    setDisplaySessionTime(config.timeAttack ? getInitialTimeAttackSeconds(config.difficulty) : 0);
    setRecords([]);

    scoreRef.current = 0;
    recordsRef.current = [];
    questionLockedRef.current = false;
    endedRef.current = false;
    sessionStartRef.current = Date.now();
    questionStartRef.current = Date.now();
    questionLimitRef.current = firstTime;
    sessionTimeRef.current = config.timeAttack ? getInitialTimeAttackSeconds(config.difficulty) : 0;
    lastTickRef.current = Date.now();

    playSfx(SOUND.start);
    loadMusic();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Salir de la partida', 'Si salís ahora no se guardará nada de esta sesión.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await unloadMusic();
            cancelGame();
          }
        }
      ]);
      return true;
    });

    return () => {
      backHandler.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      unloadMusic().catch(() => undefined);
    };
  }, [config?.mode, config?.difficulty, config?.iterations, config?.timeAttack, config?.dynamicDifficulty]);

  useEffect(() => {
    if (!config || !currentQuestion || endedRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    questionStartRef.current = Date.now();
    questionLimitRef.current = currentQuestion.timeLimitSec;
    questionLockedRef.current = false;
    lastTickRef.current = Date.now();
    setInput('');
    setSelectedChoice(null);
    setFeedback(null);
    setDisplayQuestionTime(currentQuestion.timeLimitSec);

    timerRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - questionStartRef.current) / 1000;

      if (config.timeAttack) {
        const now = Date.now();
        const deltaSec = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;

        const remaining = Math.max(0, sessionTimeRef.current - deltaSec);
        sessionTimeRef.current = remaining;
        setDisplaySessionTime(remaining);

        const normalized = remaining / Math.max(1, timeAttackMax);
        const rate = 1 + (1 - Math.max(0, Math.min(1, normalized))) * 0.45;
        if (musicSoundRef.current) {
          musicSoundRef.current.setRateAsync(rate, true).catch(() => undefined);
        }

        if (remaining <= 0) {
          void handleTimeout();
        }
      } else {
        const remaining = Math.max(0, questionLimitRef.current - elapsedSec);
        setDisplayQuestionTime(remaining);

        const normalized = remaining / Math.max(1, questionLimitRef.current);
        const rate = 1 + (1 - Math.max(0, Math.min(1, normalized))) * 0.35;
        if (musicSoundRef.current) {
          musicSoundRef.current.setRateAsync(rate, true).catch(() => undefined);
        }

        if (remaining <= 0) {
          void handleTimeout();
        }
      }
    }, 120);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [index, currentQuestion?.id, config?.timeAttack]);

  const goNext = (nextRecords: AnswerRecord[]) => {
    const nextIndex = index + 1;
    if (nextIndex >= questions.length) {
      void endSession(nextRecords);
      return;
    }
    setIndex(nextIndex);
  };

  const registerResult = async ({
    userAnswer,
    isCorrect,
    timedOut
  }: {
    userAnswer: string | null;
    isCorrect: boolean;
    timedOut: boolean;
  }) => {
    if (!config || !currentQuestion || endedRef.current || questionLockedRef.current) return;
    questionLockedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const responseMs = timedOut ? null : Date.now() - questionStartRef.current;
    const awardedPoints = calculatePoints({
      isCorrect,
      timedOut,
      responseMs,
      timeLimitSec: currentQuestion.timeLimitSec,
      config
    });

    scoreRef.current += awardedPoints;
    setScore(scoreRef.current);

    let nextLives = livesRef.current;

    if (isCorrect) {
      setCorrect((value) => value + 1);
      setFeedback('correct');
      await playSfx(SOUND.correct);
      await haptic('success');
      if (config.timeAttack) {
        const nextTime = sessionTimeRef.current + getTimeAttackRewardSeconds();
        sessionTimeRef.current = nextTime;
        setDisplaySessionTime(nextTime);
      }
    } else if (timedOut) {
      setTimeouts((value) => value + 1);
      setFeedback('timeout');
      await playSfx(SOUND.wrong);
      await haptic('error');
      if (config.timeAttack) {
        const nextTime = Math.max(0, sessionTimeRef.current - getTimeAttackTimeoutPenaltySeconds());
        sessionTimeRef.current = nextTime;
        setDisplaySessionTime(nextTime);
      } else {
        nextLives = Math.max(0, nextLives - 1);
        livesRef.current = nextLives;
        setLives(nextLives);
      }
    } else {
      setIncorrect((value) => value + 1);
      setFeedback('wrong');
      await playSfx(SOUND.wrong);
      await haptic('error');
      if (config.timeAttack) {
        const nextTime = Math.max(0, sessionTimeRef.current - getTimeAttackPenaltySeconds());
        sessionTimeRef.current = nextTime;
        setDisplaySessionTime(nextTime);
      } else {
        nextLives = Math.max(0, nextLives - 1);
        livesRef.current = nextLives;
        setLives(nextLives);
      }
    }

    const newRecord: AnswerRecord = {
      questionId: currentQuestion.id,
      questionIndex: index + 1,
      kind: currentQuestion.kind,
      expression:
        currentQuestion.kind === 'trueFalse' && currentQuestion.statementValue !== undefined
          ? `¿${currentQuestion.expression} = ${formatNumber(currentQuestion.statementValue)}?`
          : currentQuestion.expression,
      expectedAnswer: currentQuestion.answer,
      userAnswer,
      isCorrect,
      timedOut,
      responseMs,
      awardedPoints,
      timeLimitSec: currentQuestion.timeLimitSec
    };

    const nextRecords = [...recordsRef.current, newRecord];
    recordsRef.current = nextRecords;
    setRecords(nextRecords);

    setTimeout(() => {
      if (!config.timeAttack) {
        if (livesRef.current <= 0) {
          void endSession(nextRecords);
        } else {
          goNext(nextRecords);
        }
      } else {
        if (sessionTimeRef.current <= 0) {
          void endSession(nextRecords);
        } else {
          goNext(nextRecords);
        }
      }
    }, 450);
  };

  const handleTimeout = async () => {
    if (endedRef.current || questionLockedRef.current) return;
    await registerResult({ userAnswer: null, isCorrect: false, timedOut: true });
  };

  const submitClassic = () => {
    if (!currentQuestion) return;
    const parsed = normalizeNumericInput(input);
    if (parsed === null) return;
    const correctAnswer = isAnswerCorrect(currentQuestion.answer, parsed);
    void registerResult({
      userAnswer: input,
      isCorrect: correctAnswer,
      timedOut: false
    });
  };

  const submitChoice = (value: number) => {
    if (!currentQuestion) return;
    setSelectedChoice(value);
    const correctAnswer = isAnswerCorrect(currentQuestion.answer, value);
    void registerResult({
      userAnswer: formatNumber(value),
      isCorrect: correctAnswer,
      timedOut: false
    });
  };

  const submitTrueFalse = (answer: boolean) => {
    if (!currentQuestion || currentQuestion.statementIsTrue === undefined) return;
    const correctAnswer = currentQuestion.statementIsTrue === answer;
    void registerResult({
      userAnswer: answer ? 'Verdadero' : 'Falso',
      isCorrect: correctAnswer,
      timedOut: false
    });
  };

  const timeProgress = config?.timeAttack
    ? displaySessionTime / Math.max(1, timeAttackMax)
    : displayQuestionTime / Math.max(1, currentQuestion?.timeLimitSec ?? 1);

  if (!config || !currentQuestion) {
    return (
      <ScreenShell>
        <Card>
          <Text style={styles.title}>Preparando partida...</Text>
        </Card>
      </ScreenShell>
    );
  }

  const statementValue = currentQuestion.statementValue ?? currentQuestion.answer;

  return (
    <ScreenShell>
      <Card>
        <Text style={styles.title}>Partida en curso</Text>
        <Text style={styles.meta}>
          {getQuestionLabel(currentQuestion.kind)} · {getDifficultyLabel(config.difficulty)} · {getModeConfigKey(config)}
        </Text>
        <Text style={styles.meta}>
          {index + 1} / {config.iterations} preguntas · Vidas: {config.timeAttack ? '∞' : lives}
        </Text>
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={timeProgress} />
        </View>
        <Text style={styles.timer}>
          {config.timeAttack
            ? `Tiempo total: ${displaySessionTime.toFixed(1)} s`
            : `Tiempo restante: ${displayQuestionTime.toFixed(1)} s`}
        </Text>
        <Text style={styles.points}>Puntaje: {score}</Text>
      </Card>

      <Card style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.questionLabel}>Resolvé</Text>

          {currentQuestion.kind === 'trueFalse' ? (
            <Text style={styles.questionText}>
              ¿{currentQuestion.expression} = {formatNumber(statementValue)}?
            </Text>
          ) : (
            <Text style={styles.questionText}>{currentQuestion.expression}</Text>
          )}

          {currentQuestion.kind === 'classic' ? (
            <>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Escribí el resultado"
                placeholderTextColor={theme.colors.muted}
                keyboardType="decimal-pad"
                style={styles.input}
                selectionColor={theme.colors.primary}
              />
              <PrimaryButton title="Confirmar" onPress={submitClassic} disabled={!input.trim()} />
            </>
          ) : null}

          {currentQuestion.kind === 'multipleChoice' ? (
            <View style={{ marginTop: 10 }}>
              {currentQuestion.options?.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => submitChoice(option)}
                  style={({ pressed }) => [
                    styles.choiceBtn,
                    selectedChoice === option && styles.choiceBtnActive,
                    pressed && styles.choicePressed
                  ]}
                >
                  <Text style={styles.choiceText}>{formatNumber(option)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {currentQuestion.kind === 'trueFalse' ? (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Verdadero" onPress={() => submitTrueFalse(true)} tone="success" />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Falso" onPress={() => submitTrueFalse(false)} tone="danger" />
              </View>
            </View>
          ) : null}
        </View>

        <View>
          <Text style={styles.feedback}>
            {feedback === 'correct' ? 'Correcto' : feedback === 'wrong' ? 'Incorrecto' : feedback === 'timeout' ? 'Tiempo agotado' : ' '}
          </Text>
          <PrimaryButton
            title="Cancelar partida"
            onPress={() => {
              Alert.alert('Cancelar partida', 'No se guardará nada de esta sesión.', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  style: 'destructive',
                  onPress: async () => {
                    await unloadMusic();
                    cancelGame();
                  }
                }
              ]);
            }}
            tone="ghost"
          />
        </View>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '900'
  },
  meta: {
    color: theme.colors.muted,
    marginTop: 4,
    fontSize: 12
  },
  timer: {
    color: theme.colors.text,
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800'
  },
  points: {
    color: theme.colors.primary,
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900'
  },
  questionLabel: {
    color: theme.colors.muted,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700'
  },
  questionText: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 14,
    lineHeight: 36
  },
  input: {
    backgroundColor: theme.colors.bgSoft,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 10
  },
  choiceBtn: {
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center'
  },
  choiceBtnActive: {
    backgroundColor: theme.colors.primarySoft
  },
  choicePressed: {
    transform: [{ scale: 0.99 }]
  },
  choiceText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  feedback: {
    color: theme.colors.warning,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 24,
    marginBottom: 10
  }
});
