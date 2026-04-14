import { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS } from '../types';
import type { Stimulus, TestMode, TrialData, TrialType } from '../types';
import { useInputTracking } from '../hooks/useInputTracking';

interface Props {
  mode: TestMode;
  trialsPerPhase: number;   // Color Naming / Incongruent 各フェーズの試行数
  onComplete: (trials: TrialData[]) => void;
  onAbort: () => void;      // 途中中止：テスト開始前の画面へ戻る
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

export function StroopTask({ mode, trialsPerPhase, onComplete, onAbort }: Props) {
  const [stimuli] = useState(() => buildStimuli(mode, trialsPerPhase));
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<'blank' | 'stimulus' | 'phase-intro'>(
    mode === 'both' ? 'phase-intro' : 'blank',
  );
  const [stimulusShownAt, setStimulusShownAt] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const pausedAtRef = useRef<number | null>(null);

  const trialsRef = useRef<TrialData[]>([]);
  const { reset, getSnapshot } = useInputTracking(
    phase === 'stimulus' && !showConfirm,
    stimulusShownAt,
  );

  const currentStimulus = stimuli[trialIndex];
  const totalTrials = stimuli.length;

  // blank -> stimulusへ自動遷移（モーダル表示中は停止）
  useEffect(() => {
    if (phase === 'blank' && !showConfirm) {
      const timer = setTimeout(() => {
        reset();
        setStimulusShownAt(performance.now());
        setPhase('stimulus');
      }, ISI_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, reset, showConfirm]);

  // phase-intro -> blank（モーダル表示中は停止）
  useEffect(() => {
    if (phase === 'phase-intro' && !showConfirm) {
      const timer = setTimeout(() => setPhase('blank'), PHASE_INTRO_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, showConfirm]);

  const handleCancelClick = () => {
    if (showConfirm) return;
    pausedAtRef.current = performance.now();
    setShowConfirm(true);
  };

  const handleConfirmNo = () => {
    // モーダル表示中に進んだ時間を stimulusShownAt に加算して RT を保つ
    if (pausedAtRef.current !== null) {
      const pausedDuration = performance.now() - pausedAtRef.current;
      if (phase === 'stimulus') {
        setStimulusShownAt(t => t + pausedDuration);
      }
      pausedAtRef.current = null;
    }
    setShowConfirm(false);
  };

  const handleConfirmYes = () => {
    pausedAtRef.current = null;
    setShowConfirm(false);
    onAbort();
  };

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

  // キーボード操作：1/2/3/4 キーで色選択（モーダル表示中は無効）
  useEffect(() => {
    if (phase !== 'stimulus' || showConfirm) return;
    const handleKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < COLORS.length) {
        handleAnswer(COLORS[idx].name);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, handleAnswer, showConfirm]);

  const instruction =
    currentStimulus.type === 'color-naming'
      ? '表示された丸の色を答えてください'
      : '表示された文字のインクの色を答えてください';

  return (
    <div className="screen task-screen">
      <button
        className="abort-btn"
        onClick={handleCancelClick}
        aria-label="テストを中止"
        type="button"
      >
        ×
      </button>

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
            disabled={phase !== 'stimulus' || showConfirm}
          >
            <span className="key-hint">{i + 1}</span>
            <span className="btn-label">{c.name}</span>
          </button>
        ))}
      </div>

      <p className="hint">ボタンをクリック、または数字キー 1〜{COLORS.length} で回答</p>

      {showConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-message">テストを中止します</div>
            <div className="modal-buttons">
              <button className="modal-btn" type="button" onClick={handleConfirmYes}>
                はい
              </button>
              <button className="modal-btn" type="button" onClick={handleConfirmNo}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
