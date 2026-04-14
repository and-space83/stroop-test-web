import { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS } from '../types';
import type { Stimulus, TestMode, TrialData, TrialType } from '../types';
import { useInputTracking } from '../hooks/useInputTracking';

interface Props {
  mode: TestMode;
  trialsPerPhase: number;   // Color Naming / Incongruent 各フェーズの試行数
  onComplete: (trials: TrialData[]) => void;
}

const STIMULUS_OFFSETS_X = [-50, 0, 50] as const;

function randomOffsetX(): number {
  return STIMULUS_OFFSETS_X[Math.floor(Math.random() * STIMULUS_OFFSETS_X.length)];
}

function generateColorNamingStimuli(count: number): Stimulus[] {
  const stimuli: Stimulus[] = [];
  for (let i = 0; i < count; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    stimuli.push({
      type: 'color-naming',
      word: '',
      wordColor: color.value,
      correctAnswer: color.name,
      isCongruent: true,
      offsetX: randomOffsetX(),
    });
  }
  return stimuli;
}

function generateWordStimuli(count: number): Stimulus[] {
  const stimuli: Stimulus[] = [];
  for (let i = 0; i < count; i++) {
    // Incongruent モード：常に文字とインク色が異なる
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const others = COLORS.filter(c => c.name !== wordColor.name);
    const wordObj = others[Math.floor(Math.random() * others.length)];

    stimuli.push({
      type: 'word',
      word: wordObj.name,
      wordColor: wordColor.value,
      correctAnswer: wordColor.name,
      isCongruent: false,
      offsetX: randomOffsetX(),
    });
  }
  return stimuli;
}

function buildStimuli(mode: TestMode, perPhase: number): Stimulus[] {
  if (mode === 'color-naming') return generateColorNamingStimuli(perPhase);
  if (mode === 'incongruent') return generateWordStimuli(perPhase);
  return [
    ...generateColorNamingStimuli(perPhase),
    ...generateWordStimuli(perPhase),
  ];
}

function phaseLabel(type: TrialType): string {
  return type === 'color-naming' ? 'Color Naming' : 'Incongruent Color Naming';
}

const ISI_MS = 300;          // 問題間の空白時間
const PHASE_INTRO_MS = 1500; // both モードのフェーズ切替時の案内表示時間

export function StroopTask({ mode, trialsPerPhase, onComplete }: Props) {
  const [stimuli] = useState(() => buildStimuli(mode, trialsPerPhase));
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<'blank' | 'stimulus' | 'phase-intro'>(
    mode === 'both' ? 'phase-intro' : 'blank',
  );
  const [stimulusShownAt, setStimulusShownAt] = useState(0);

  const trialsRef = useRef<TrialData[]>([]);
  const { reset, getSnapshot } = useInputTracking(phase === 'stimulus', stimulusShownAt);

  const currentStimulus = stimuli[trialIndex];
  const totalTrials = stimuli.length;

  // blank -> stimulusへ自動遷移
  useEffect(() => {
    if (phase === 'blank') {
      const timer = setTimeout(() => {
        reset();
        setStimulusShownAt(performance.now());
        setPhase('stimulus');
      }, ISI_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, reset]);

  // phase-intro -> blank
  useEffect(() => {
    if (phase === 'phase-intro') {
      const timer = setTimeout(() => setPhase('blank'), PHASE_INTRO_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleAnswer = useCallback((response: string) => {
    if (phase !== 'stimulus') return;
    const now = performance.now();
    const reactionTime = now - stimulusShownAt;
    const stimulus = stimuli[trialIndex];
    const isCorrect = response === stimulus.correctAnswer;
    const snapshot = getSnapshot();

    const trial: TrialData = {
      trialIndex,
      stimulus,
      response,
      isCorrect,
      reactionTime,
      stimulusShownAt,
      ...snapshot,
    };

    trialsRef.current.push(trial);

    const nextIndex = trialIndex + 1;
    if (nextIndex >= totalTrials) {
      onComplete(trialsRef.current);
      return;
    }
    const crossingBoundary =
      mode === 'both' && stimuli[nextIndex].type !== stimuli[trialIndex].type;
    setTrialIndex(nextIndex);
    setPhase(crossingBoundary ? 'phase-intro' : 'blank');
  }, [phase, stimulusShownAt, stimuli, trialIndex, totalTrials, onComplete, mode, getSnapshot]);

  // キーボード操作：1/2/3/4 キーで色選択
  useEffect(() => {
    if (phase !== 'stimulus') return;
    const handleKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < COLORS.length) {
        handleAnswer(COLORS[idx].name);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, handleAnswer]);

  const instruction =
    currentStimulus.type === 'color-naming'
      ? '表示された丸の色を答えてください'
      : '表示された文字のインクの色を答えてください';

  return (
    <div className="screen task-screen">
      <div className="progress">
        {mode === 'both' && (
          <span className="phase-tag">{phaseLabel(currentStimulus.type)} / </span>
        )}
        試行 {trialIndex + 1} / {totalTrials}
      </div>

      <p className="task-instruction">{instruction}</p>

      <div className="stimulus-area">
        {phase === 'phase-intro' && (
          <div className="phase-intro">
            <div className="phase-intro-title">{phaseLabel(currentStimulus.type)}</div>
            <div className="phase-intro-sub">{instruction}</div>
          </div>
        )}
        {phase === 'stimulus' && currentStimulus.type === 'word' && (
          <div
            className="stimulus-word"
            style={{
              color: currentStimulus.wordColor,
              transform: `translateX(${currentStimulus.offsetX}px)`,
            }}
          >
            {currentStimulus.word}
          </div>
        )}
        {phase === 'stimulus' && currentStimulus.type === 'color-naming' && (
          <div
            className="stimulus-circle"
            style={{
              background: currentStimulus.wordColor,
              transform: `translateX(${currentStimulus.offsetX}px)`,
            }}
            aria-label="colored circle"
          />
        )}
      </div>

      <div className="answer-buttons">
        {COLORS.map((c, i) => (
          <button
            key={c.name}
            className="answer-btn"
            onClick={() => handleAnswer(c.name)}
            disabled={phase !== 'stimulus'}
          >
            <span className="key-hint">{i + 1}</span>
            <span className="btn-label">{c.name}</span>
          </button>
        ))}
      </div>

      <p className="hint">ボタンをクリック、または数字キー 1〜{COLORS.length} で回答</p>
    </div>
  );
}
