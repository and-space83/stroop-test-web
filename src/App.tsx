import { useState } from 'react';
import type { AppScreen, Participant, SessionData, TestMode, TrialData } from './types';
import { ParticipantForm } from './components/ParticipantForm';
import { StroopTask } from './components/StroopTask';
import { Results } from './components/Results';
import './App.css';

const TOTAL_TRIALS = 20;

function App() {
  const [screen, setScreen] = useState<AppScreen>('form');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [mode, setMode] = useState<TestMode>('incongruent');
  const [session, setSession] = useState<SessionData | null>(null);

  const handleFormSubmit = (p: Participant, selectedMode: TestMode) => {
    setParticipant(p);
    setMode(selectedMode);
    setScreen('task');
  };

  const handleTaskComplete = (trials: TrialData[]) => {
    if (!participant) return;

    const correctCount = trials.filter(t => t.isCorrect).length;
    const averageRT = trials.reduce((s, t) => s + t.reactionTime, 0) / trials.length;
    const wordTrials = trials.filter(t => t.stimulus.type === 'word');
    const congruent = wordTrials.filter(t => t.stimulus.isCongruent);
    const incongruent = wordTrials.filter(t => !t.stimulus.isCongruent);
    const congruentAvgRT = congruent.length > 0
      ? congruent.reduce((s, t) => s + t.reactionTime, 0) / congruent.length
      : 0;
    const incongruentAvgRT = incongruent.length > 0
      ? incongruent.reduce((s, t) => s + t.reactionTime, 0) / incongruent.length
      : 0;

    const sessionData: SessionData = {
      participant,
      mode,
      trials,
      startedAt: participant.createdAt,
      finishedAt: Date.now(),
      totalTrials: trials.length,
      correctCount,
      averageRT,
      congruentAvgRT,
      incongruentAvgRT,
    };
    setSession(sessionData);
    setScreen('results');
  };

  const handleRestart = () => {
    setParticipant(null);
    setSession(null);
    setScreen('form');
  };

  const handleAbort = () => {
    setParticipant(null);
    setSession(null);
    setScreen('form');
  };

  return (
    <div className="app">
      {screen === 'form' && <ParticipantForm onSubmit={handleFormSubmit} />}
      {screen === 'task' && (
        <StroopTask
          mode={mode}
          trialsPerPhase={TOTAL_TRIALS}
          onComplete={handleTaskComplete}
          onAbort={handleAbort}
        />
      )}
      {screen === 'results' && session && (
        <Results session={session} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;
