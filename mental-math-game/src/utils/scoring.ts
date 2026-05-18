import { GameConfig, GameMode } from '../types';

export function getBaseQuestionTimeSec(difficulty: 'easy' | 'medium' | 'hard', mode: GameMode): number {
  const map = {
    easy: { classic: 20, multipleChoice: 14, trueFalse: 10 },
    medium: { classic: 15, multipleChoice: 11, trueFalse: 8 },
    hard: { classic: 12, multipleChoice: 9, trueFalse: 6 }
  } as const;

  return map[difficulty][mode];
}

export function getLivesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): number {
  const map = { easy: 5, medium: 4, hard: 3 } as const;
  return map[difficulty];
}

export function getInitialTimeAttackSeconds(difficulty: 'easy' | 'medium' | 'hard'): number {
  const map = { easy: 60, medium: 55, hard: 50 } as const;
  return map[difficulty];
}

export function getTimeAttackRewardSeconds(): number {
  return 5;
}

export function getTimeAttackPenaltySeconds(): number {
  return 4;
}

export function getTimeAttackTimeoutPenaltySeconds(): number {
  return 5;
}

export function getDynamicTimeLimitSec(baseLimitSec: number, questionIndex: number, totalQuestions: number): number {
  if (totalQuestions <= 1) {
    return baseLimitSec;
  }

  const progress = questionIndex / (totalQuestions - 1);
  const factor = 1 - progress * 0.4;
  return Math.max(4, roundTo(baseLimitSec * factor, 1));
}

function roundTo(value: number, decimals: number): number {
  const pow = Math.pow(10, decimals);
  return Math.round(value * pow) / pow;
}

export function getSessionBonus(config: GameConfig): number {
  const difficultyBonus = { easy: 0, medium: 20, hard: 40 }[config.difficulty];
  const modeBonus = { classic: 20, multipleChoice: 10, trueFalse: 5 }[config.mode];
  const iterationsBonus = Math.max(0, config.iterations - 10) * 2;
  const timeAttackBonus = config.timeAttack ? 25 : 0;
  const dynamicBonus = config.dynamicDifficulty ? 25 : 0;
  return difficultyBonus + modeBonus + iterationsBonus + timeAttackBonus + dynamicBonus;
}

export function getPerQuestionBonus(config: GameConfig): number {
  return Math.max(0, Math.round(getSessionBonus(config) / Math.max(1, config.iterations)));
}

export function calculatePoints(params: {
  isCorrect: boolean;
  timedOut: boolean;
  responseMs: number | null;
  timeLimitSec: number;
  config: GameConfig;
}): number {
  const perQuestionBonus = getPerQuestionBonus(params.config);

  if (params.timedOut) {
    return -50;
  }

  if (!params.isCorrect) {
    return -30;
  }

  const fastThresholdMs = params.timeLimitSec * 1000 * 0.75;
  const base = params.responseMs !== null && params.responseMs <= fastThresholdMs ? 100 : 70;
  return base + perQuestionBonus;
}

export function getReactionLabel(responseMs: number | null, timeLimitSec: number, isCorrect: boolean): string {
  if (!isCorrect || responseMs === null) return 'Sin bonificación';
  const fastThresholdMs = timeLimitSec * 1000 * 0.75;
  return responseMs <= fastThresholdMs ? 'Respuesta rápida' : 'Respuesta correcta';
}
