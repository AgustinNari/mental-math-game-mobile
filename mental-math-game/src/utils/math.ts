import { Difficulty, GameConfig, GameMode, Question } from '../types';
import { getBaseQuestionTimeSec, getDynamicTimeLimitSec } from './scoring';

const DECIMAL_ALLOWED = [0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.5, 3.25, 3.5, 4.5];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(items: T[]): T => items[randomInt(0, items.length - 1)];

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const roundTo = (value: number, decimals = 2) => {
  const pow = Math.pow(10, decimals);
  return Math.round(value * pow) / pow;
};

const prettyNumber = (value: number): string => {
  const normalized = roundTo(value, 2);
  if (Number.isInteger(normalized)) return `${normalized}`;
  return `${normalized}`.replace('.', ',').replace(/0+$/, '').replace(/,$/, '');
};

const expr = {
  add: (a: number, b: number) => `${prettyNumber(a)} + ${prettyNumber(b)}`,
  sub: (a: number, b: number) => `${prettyNumber(a)} - ${prettyNumber(b)}`,
  mul: (a: number, b: number) => `${prettyNumber(a)} × ${prettyNumber(b)}`,
  div: (a: number, b: number) => `${prettyNumber(a)} ÷ ${prettyNumber(b)}`,
  pow: (a: number, b: number) => `${prettyNumber(a)}^${prettyNumber(b)}`,
  sqrt: (a: number) => `√(${prettyNumber(a)})`,
  log: (base: number, value: number) => `log${prettyNumber(base)}(${prettyNumber(value)})`,
  wrap: (s: string) => `(${s})`
};

function isIntegerLike(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 0.0001;
}

function buildClassicEasy(): { expression: string; answer: number } {
  const type = pick(['add', 'sub', 'mul', 'div', 'combo'] as const);
  if (type === 'add') {
    const a = randomInt(0, 20);
    const b = randomInt(0, 20);
    return { expression: expr.add(a, b), answer: a + b };
  }
  if (type === 'sub') {
    const a = randomInt(5, 30);
    const b = randomInt(0, a);
    return { expression: expr.sub(a, b), answer: a - b };
  }
  if (type === 'mul') {
    const a = randomInt(0, 12);
    const b = randomInt(0, 12);
    return { expression: expr.mul(a, b), answer: a * b };
  }
  if (type === 'div') {
    const divisor = randomInt(1, 12);
    const quotient = randomInt(1, 12);
    const dividend = divisor * quotient;
    return { expression: expr.div(dividend, divisor), answer: quotient };
  }
  const a = randomInt(0, 20);
  const b = randomInt(0, 20);
  const c = randomInt(0, 10);
  return { expression: `${expr.wrap(expr.add(a, b))} - ${prettyNumber(c)}`, answer: a + b - c };
}

function buildClassicMedium(): { expression: string; answer: number } {
  const type = pick(['parenAdd', 'parenMul', 'divDec', 'sqrt', 'pow', 'mix'] as const);
  if (type === 'parenAdd') {
    const a = randomInt(10, 50);
    const b = randomInt(1, 40);
    const c = randomInt(1, 20);
    const text = `${expr.wrap(expr.add(a, b))} - ${prettyNumber(c)}`;
    return { expression: text, answer: a + b - c };
  }
  if (type === 'parenMul') {
    const a = randomInt(2, 20);
    const b = randomInt(2, 20);
    const c = randomInt(2, 12);
    const text = `${expr.wrap(expr.add(a, b))} × ${prettyNumber(c)}`;
    return { expression: text, answer: (a + b) * c };
  }
  if (type === 'divDec') {
    const quotient = pick(DECIMAL_ALLOWED);
    const divisor = randomInt(2, 10);
    const dividend = roundTo(quotient * divisor, 2);
    return { expression: expr.div(dividend, divisor), answer: roundTo(dividend / divisor, 2) };
  }
  if (type === 'sqrt') {
    const root = randomInt(3, 20);
    return { expression: expr.sqrt(root * root), answer: root };
  }
  if (type === 'pow') {
    const a = randomInt(2, 10);
    return { expression: expr.pow(a, 2), answer: a * a };
  }
  const a = randomInt(10, 40);
  const b = randomInt(2, 12);
  const c = randomInt(1, 12);
  const text = `${prettyNumber(a)} + ${expr.wrap(`${prettyNumber(b)} × ${prettyNumber(c)}`)}`;
  return { expression: text, answer: a + b * c };
}

function buildClassicHard(): { expression: string; answer: number } {
  const type = pick(['nested', 'mix3', 'log', 'sqrtPlus', 'pow3', 'chain'] as const);
  if (type === 'nested') {
    const a = randomInt(5, 40);
    const b = randomInt(5, 30);
    const c = randomInt(2, 12);
    const d = randomInt(2, 10);
    const text = `${expr.wrap(`${expr.wrap(`${prettyNumber(a)} + ${prettyNumber(b)}`)} × ${prettyNumber(c)}`)} ÷ ${prettyNumber(d)}`;
    return { expression: text, answer: roundTo(((a + b) * c) / d, 2) };
  }
  if (type === 'mix3') {
    const a = randomInt(10, 60);
    const b = randomInt(1, 20);
    const c = randomInt(2, 14);
    const d = randomInt(1, 25);
    const text = `${prettyNumber(a)} + ${expr.wrap(`${prettyNumber(b)} × ${prettyNumber(c)}`)} - ${prettyNumber(d)}`;
    return { expression: text, answer: a + b * c - d };
  }
  if (type === 'log') {
    const base = pick([2, 3, 10]);
    const exponent = randomInt(2, 5);
    const value = Math.pow(base, exponent);
    const extra = randomInt(0, 12);
    const text = `${expr.log(base, value)} + ${prettyNumber(extra)}`;
    return { expression: text, answer: exponent + extra };
  }
  if (type === 'sqrtPlus') {
    const root = randomInt(4, 15);
    const extra = randomInt(1, 30);
    return { expression: `${expr.sqrt(root * root)} + ${prettyNumber(extra)}`, answer: root + extra };
  }
  if (type === 'pow3') {
    const a = randomInt(2, 8);
    const b = randomInt(1, 12);
    return { expression: `${expr.pow(a, 3)} - ${prettyNumber(b)}`, answer: a * a * a - b };
  }
  const a = randomInt(10, 50);
  const b = randomInt(1, 20);
  const c = randomInt(2, 15);
  const d = randomInt(2, 12);
  const text = `${expr.wrap(`${prettyNumber(a)} - ${prettyNumber(b)}`)} × ${prettyNumber(c)} ÷ ${prettyNumber(d)}`;
  return { expression: text, answer: roundTo(((a - b) * c) / d, 2) };
}

function buildQuestionCore(difficulty: Difficulty): { expression: string; answer: number } {
  if (difficulty === 'easy') return buildClassicEasy();
  if (difficulty === 'medium') return buildClassicMedium();
  return buildClassicHard();
}

function normalizeAnswer(value: number): number {
  return roundTo(value, 2);
}

function buildMultipleChoiceOptions(answer: number): number[] {
  const base = normalizeAnswer(answer);
  const variations = new Set<number>([base]);

  const makeDelta = () => {
    const pool = isIntegerLike(base) ? [1, 2, 3, 4, 5, 6, 7, 8] : [0.25, 0.5, 0.75, 1, 1.25, 1.5];
    const delta = pick(pool);
    return Math.random() > 0.5 ? delta : -delta;
  };

  while (variations.size < 4) {
    const candidate = normalizeAnswer(base + makeDelta());
    if (Math.abs(candidate - base) > 0.0001) {
      variations.add(candidate);
    }
  }

  return shuffle(Array.from(variations));
}

function buildTrueFalse(answer: number): { statementValue: number; statementIsTrue: boolean } {
  const makeFalseValue = () => {
    const delta = isIntegerLike(answer) ? pick([1, 2, 3, 4, 5]) : pick([0.25, 0.5, 0.75, 1, 1.25]);
    const candidate = normalizeAnswer(answer + (Math.random() > 0.5 ? delta : -delta));
    if (Math.abs(candidate - answer) < 0.0001) {
      return normalizeAnswer(candidate + 1);
    }
    return candidate;
  };

  const truthy = Math.random() > 0.5;
  return {
    statementValue: truthy ? answer : makeFalseValue(),
    statementIsTrue: truthy
  };
}

export function buildQuestion(config: GameConfig, questionIndex: number): Question {
  const base = buildQuestionCore(config.difficulty);
  const baseTime = getBaseQuestionTimeSec(config.difficulty, config.mode);
  const timeLimitSec = config.dynamicDifficulty
    ? getDynamicTimeLimitSec(baseTime, questionIndex, config.iterations)
    : baseTime;

  const answer = normalizeAnswer(base.answer);

  if (config.mode === 'classic') {
    return {
      id: uid(),
      kind: 'classic',
      expression: base.expression,
      answer,
      timeLimitSec
    };
  }

  if (config.mode === 'multipleChoice') {
    return {
      id: uid(),
      kind: 'multipleChoice',
      expression: base.expression,
      answer,
      options: buildMultipleChoiceOptions(answer),
      timeLimitSec
    };
  }

  const tf = buildTrueFalse(answer);
  return {
    id: uid(),
    kind: 'trueFalse',
    expression: base.expression,
    answer,
    statementValue: tf.statementValue,
    statementIsTrue: tf.statementIsTrue,
    timeLimitSec
  };
}

export function normalizeNumericInput(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (Number.isNaN(value) || !Number.isFinite(value)) return null;
  return roundTo(value, 2);
}

export function isAnswerCorrect(expected: number, provided: number): boolean {
  return Math.abs(normalizeAnswer(expected) - normalizeAnswer(provided)) <= 0.01;
}

export function formatNumber(value: number): string {
  return prettyNumber(value);
}

export function getQuestionLabel(mode: GameMode): string {
  if (mode === 'classic') return 'Clásico';
  if (mode === 'trueFalse') return 'Verdadero / Falso';
  return 'Múltiple elección';
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  if (difficulty === 'easy') return 'Fácil';
  if (difficulty === 'medium') return 'Media';
  return 'Difícil';
}

export function getModeConfigKey(config: GameConfig): string {
  return [
    config.mode,
    config.difficulty,
    config.iterations,
    config.timeAttack ? 'TA' : 'NTA',
    config.dynamicDifficulty ? 'DYN' : 'NODYN'
  ].join('|');
}
