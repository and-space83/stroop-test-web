import { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS } from '../types';
import type { Stimulus, TrialData } from '../types';
import { useInputTracking } from '../hooks/useInputTracking';

interface Props {
  totalTrials: number;
  congruentRatio: number; // 0〜1（一致条件の割合）
  onComplete: (trials: TrialData[]) => void;
}

function generateStimuli(count: number, congruentRatio: number): Stimulus[] {
  const stimuli: Stimulus[] = [];
  for (let i = 0; i < count; i++) {
    const isCongruent = Math.random() < congruentRatio;
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    let wordObj;
    if (isCongruent) {
      wordObj = wordColor;
    } else {
      const others = COLORS.filter(c => c.name !== wordColor.name);
      wordObj = others[Math.floor(Math.random() * others.length)];
    }

    stimuli.push({
      word: wordObj.name,
      wordColor: wordColor.value,
      correctAnswer: wordColor.name,
      isCongruent,
    });
  }
  return stimuli;
}

export function StroopTask({ totalTrials, congruentRatio, onComplete }: Props) {
  const [stimuli] = useState(() => generateStimuli(totalTrials, congruentRatio));
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'stimulus' | 'feedback'>('ready');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [stimulusShownAt, setStimulusShownAt] = useState(0);

  const trialsRef = useRef<TrialData[]>([]);
  const { reset, getSnapshot } = useInputTracking(phase === 'stimulus', stimulusShownAt);

  // ready -> stimulusへ自動遷移
  useEffect(() => {
    if (phase === 'ready') {
      const timer = setTimeout(() => {
        reset();
        setStimulusShownAt(performance.now());
        setPhase('stimulus');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, reset]);

  // feedback -> 次の試行 or 完了
  useEffect(() => {
    if (phase === 'feedback') {
      const timer = setTimeout(() => {
        if (trialIndex + 1 >= totalTrials) {
          onComplete(trialsRef.current);
        } else {
          setTrialIndex(i => i + 1);
          setPhase('ready');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, trialIndex, totalTrials, onComplete]);

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
    setLastCorrect(isCorrect);
    setPhase('feedback');
  }, [phase, stimulusShownAt, stimuli, trialIndex, getSnapshot]);

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

  const currentStimulus = stimuli[trialIndex];

  return (
    <div className="screen task-screen">
      <div className="progress">
        試行 {trialIndex + 1} / {totalTrials}
      </div>

      <div className="stimulus-area">
        {phase === 'ready' && <div className="fixation">+</div>}
        {phase === 'stimulus' && (
          <div
            className="stimulus-word"
            style={{ color: currentStimulus.wordColor }}
          >
            {currentStimulus.word}
          </div>
        )}
        {phase === 'feedback' && (
          <div className={`feedback ${lastCorrect ? 'correct' : 'incorrect'}`}>
            {lastCorrect ? '◯' : '✕'}
          </div>
        )}
      </div>

      <div className="answer-buttons">
        {COLORS.map((c, i) => (
          <button
            key={c.name}
            className="answer-btn"
            onClick={() => handleAnswer(c.name)}
            disabled={phase !== 'stimulus'}
            style={{ borderColor: c.value }}
          >
            <span className="key-hint">{i + 1}</span>
            <span className="btn-label">{c.name}</span>
          </button>
        ))}
      </div>

      <p className="hint">ボタンをクリック、または数字キー 1〜4 で回答</p>
    </div>
  );
}
