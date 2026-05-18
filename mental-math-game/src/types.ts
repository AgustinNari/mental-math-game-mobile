export type GameMode = 'classic' | 'trueFalse' | 'multipleChoice';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MainTab = 'settings' | 'gameConfig' | 'stats';
export type AppScreen = 'login' | 'main' | 'game' | 'summary';

export interface AppSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;
  timeAttack: boolean;
  dynamicDifficulty: boolean;
}

export interface Question {
  id: string;
  kind: GameMode;
  expression: string;
  answer: number;
  options?: number[];
  statementValue?: number;
  statementIsTrue?: boolean;
  timeLimitSec: number;
}

export interface AnswerRecord {
  questionId: string;
  questionIndex: number;
  kind: GameMode;
  expression: string;
  expectedAnswer: number;
  userAnswer: string | null;
  isCorrect: boolean;
  timedOut: boolean;
  responseMs: number | null;
  awardedPoints: number;
  timeLimitSec: number;
}

export interface GameRecord {
  id: string;
  createdAt: number;
  endedAt: number;
  config: GameConfig;
  score: number;
  correct: number;
  incorrect: number;
  timeouts: number;
  accuracy: number;
  avgResponseMs: number;
  fastestResponseMs: number;
  slowestResponseMs: number;
  durationMs: number;
  answers: AnswerRecord[];
}

export interface ProfileData {
  name: string;
  createdAt: number;
  lastLoginAt: number;
  settings: AppSettings;
  gameConfig: GameConfig;
  records: GameRecord[];
}

export type QuestionOutcome = 'correctFast' | 'correctNormal' | 'wrong' | 'timeout';
