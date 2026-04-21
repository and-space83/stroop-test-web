import { useState, useEffect } from 'react';
import type { AppScreen, Participant, SessionData, TestMode, TrialData } from './types';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { ParticipantForm } from './components/ParticipantForm';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { StroopTask } from './components/StroopTask';
import { Results } from './components/Results';
import './App.css';

const TOTAL_TRIALS = 20;

function App() {
  const auth = useAuth();
  const [screen, setScreen] = useState<AppScreen>('auth');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [mode, setMode] = useState<TestMode>('incongruent');
  const [note, setNote] = useState('');
  const [session, setSession] = useState<SessionData | null>(null);
  const [loadingParticipant, setLoadingParticipant] = useState(false);

  // 認証状態が変わったら被験者情報を取得
  useEffect(() => {
    if (auth.loading) return;

    if (!auth.user) {
      setScreen('auth');
      setParticipant(null);
      return;
    }

    // 認証済み → 被験者情報をDBから取得
    setLoadingParticipant(true);
    supabase
      .from('participants')
      .select('*')
      .eq('auth_user_id', auth.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setParticipant({
            id: data.id,
            age: data.age,
            gender: data.gender as Participant['gender'],
            handedness: data.handedness as Participant['handedness'],
            createdAt: new Date(data.created_at).getTime(),
          });
          setScreen('mode-select');
        } else {
          setParticipant(null);
          setScreen('form');
        }
        setLoadingParticipant(false);
      });
  }, [auth.user, auth.loading]);

  const handleParticipantSaved = (p: Participant) => {
    setParticipant(p);
    setScreen('mode-select');
  };

  const handleModeStart = (selectedMode: TestMode, sessionNote: string) => {
    setMode(selectedMode);
    setNote(sessionNote);
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
      note,
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
    setSession(null);
    setNote('');
    setScreen('mode-select');
  };

  const handleAbort = () => {
    setSession(null);
    setNote('');
    setScreen('mode-select');
  };

  // ローディング中
  if (auth.loading || loadingParticipant) {
    return (
      <div className="app">
        <div className="screen loading-screen">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  const participantLabel = participant
    ? `${participant.age}歳 / ${
        participant.gender === 'male' ? '男性' : participant.gender === 'female' ? '女性' : 'その他'
      } / ${participant.handedness === 'right' ? '右利き' : '左利き'}`
    : '';

  return (
    <div className="app">
      {screen === 'auth' && (
        <AuthScreen
          onSignInAnonymously={auth.signInAnonymously}
          onSignInWithGoogle={auth.signInWithGoogle}
          onSignUpWithEmail={auth.signUpWithEmail}
          onSignInWithEmail={auth.signInWithEmail}
        />
      )}
      {screen === 'form' && auth.user && (
        <ParticipantForm
          authUserId={auth.user.id}
          isGuest={auth.isGuest}
          authProvider={auth.user.app_metadata?.provider ?? 'anonymous'}
          email={auth.user.email ?? null}
          onSaved={handleParticipantSaved}
        />
      )}
      {screen === 'mode-select' && (
        <ModeSelectScreen
          onStart={handleModeStart}
          onSignOut={auth.signOut}
          participantLabel={participantLabel}
        />
      )}
      {screen === 'task' && (
        <StroopTask
          mode={mode}
          trialsPerPhase={TOTAL_TRIALS}
          onComplete={handleTaskComplete}
          onAbort={handleAbort}
        />
      )}
      {screen === 'results' && session && (
        <Results
          session={session}
          onRestart={handleRestart}
          isGuest={auth.isGuest}
          onLinkGoogle={auth.linkGoogle}
          onLinkEmail={auth.linkEmail}
        />
      )}
    </div>
  );
}

export default App;
