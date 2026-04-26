import { useState } from 'react';
import type { SessionData } from '../types';
import { UpgradeAccountModal } from './UpgradeAccountModal';

interface Props {
  session: SessionData;
  onRestart: () => void;
  onSignOut: () => Promise<void>;
  isGuest: boolean;
  onLinkGoogle: () => Promise<void>;
  onLinkEmail: (email: string, password: string) => Promise<void>;
}

const MODE_LABEL: Record<SessionData['mode'], string> = {
  'color-naming': 'Color Naming',
  'incongruent': 'Incongruent Color Naming',
  'both': 'Both（Color Naming → Incongruent）',
};

export function Results({ session, onRestart, onSignOut, isGuest, onLinkGoogle, onLinkEmail }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(isGuest);
  const { participant, mode, trials, correctCount, totalTrials, averageRT } = session;
  const accuracy = (correctCount / totalTrials) * 100;
  const hasWordTrials = trials.some(t => t.stimulus.type === 'word');
  const hasColorNamingTrials = trials.some(t => t.stimulus.type === 'color-naming');

  const colorNamingTrials = trials.filter(t => t.stimulus.type === 'color-naming');
  const wordTrials = trials.filter(t => t.stimulus.type === 'word');
  const colorNamingAvgRT = colorNamingTrials.length > 0
    ? colorNamingTrials.reduce((s, t) => s + t.reactionTime, 0) / colorNamingTrials.length
    : 0;
  const wordAvgRT = wordTrials.length > 0
    ? wordTrials.reduce((s, t) => s + t.reactionTime, 0) / wordTrials.length
    : 0;
  // both モードでは Color Naming → Incongruent の差分が干渉量の指標になる
  const interferenceEffect =
    hasColorNamingTrials && hasWordTrials ? wordAvgRT - colorNamingAvgRT : null;

  const avgJitter = trials.reduce((s, t) => s + t.mouseJitter, 0) / trials.length;
  const avgPathLength = trials.reduce((s, t) => s + t.mousePathLength, 0) / trials.length;

  return (
    <div className="screen results-screen">
      <div className="results-header">
        <h1>結果</h1>
        <button className="btn-signout" onClick={onSignOut}>
          ログアウト
        </button>
      </div>

      <div className="mode-summary">
        <strong>モード:</strong> {MODE_LABEL[mode]}
      </div>

      <div className="results-grid">
        <div className="result-card">
          <div className="result-label">正答率</div>
          <div className="result-value">{accuracy.toFixed(1)}%</div>
          <div className="result-sub">{correctCount} / {totalTrials}</div>
        </div>

        <div className="result-card">
          <div className="result-label">平均反応時間</div>
          <div className="result-value">{averageRT.toFixed(0)} ms</div>
        </div>

        {hasColorNamingTrials && (
          <div className="result-card">
            <div className="result-label">Color Naming 平均RT</div>
            <div className="result-value">{colorNamingAvgRT.toFixed(0)} ms</div>
            <div className="result-sub">{colorNamingTrials.length} 試行</div>
          </div>
        )}

        {hasWordTrials && (
          <div className="result-card">
            <div className="result-label">Incongruent 平均RT</div>
            <div className="result-value">{wordAvgRT.toFixed(0)} ms</div>
            <div className="result-sub">{wordTrials.length} 試行</div>
          </div>
        )}

        {interferenceEffect !== null && (
          <div className="result-card">
            <div className="result-label">干渉量</div>
            <div className="result-value">{interferenceEffect.toFixed(0)} ms</div>
            <div className="result-sub">Incongruent − Color Naming</div>
          </div>
        )}

        <div className="result-card">
          <div className="result-label">マウス平均ジッター</div>
          <div className="result-value">{avgJitter.toFixed(2)}</div>
          <div className="result-sub">振戦の指標</div>
        </div>

        <div className="result-card">
          <div className="result-label">マウス平均移動距離</div>
          <div className="result-value">{avgPathLength.toFixed(0)} px</div>
        </div>
      </div>

      <div className="participant-summary">
        <strong>被験者:</strong> {participant.id} / {participant.age}歳 / {
          participant.gender === 'male' ? '男性' : participant.gender === 'female' ? '女性' : 'その他'
        } / {participant.handedness === 'right' ? '右利き' : '左利き'}
        {session.note && <> / {session.note}</>}
      </div>

      <button className="btn-primary" onClick={onRestart}>
        新しいセッションを開始
      </button>

      {showUpgrade && (
        <UpgradeAccountModal
          onLinkGoogle={onLinkGoogle}
          onLinkEmail={onLinkEmail}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
