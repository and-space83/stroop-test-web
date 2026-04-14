import type { SessionData } from '../types';
import { exportSessionJSON, exportTrialsCSV, exportMousePathCSV } from '../utils/exportData';

interface Props {
  session: SessionData;
  onRestart: () => void;
}

const MODE_LABEL: Record<SessionData['mode'], string> = {
  'color-naming': 'Color Naming',
  'incongruent': 'Incongruent Color Naming',
  'both': 'Both（Color Naming → Incongruent）',
};

export function Results({ session, onRestart }: Props) {
  const { participant, mode, trials, correctCount, totalTrials, averageRT, congruentAvgRT, incongruentAvgRT } = session;
  const accuracy = (correctCount / totalTrials) * 100;
  const stroopEffect = incongruentAvgRT - congruentAvgRT;
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

  const avgJitter = trials.reduce((s, t) => s + t.mouseJitter, 0) / trials.length;
  const avgPathLength = trials.reduce((s, t) => s + t.mousePathLength, 0) / trials.length;

  return (
    <div className="screen results-screen">
      <h1>結果</h1>

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

        {hasWordTrials && (
          <div className="result-card">
            <div className="result-label">ストループ効果</div>
            <div className="result-value">{stroopEffect.toFixed(0)} ms</div>
            <div className="result-sub">不一致 − 一致</div>
          </div>
        )}

        {hasWordTrials && (
          <div className="result-card">
            <div className="result-label">一致条件 平均RT</div>
            <div className="result-value">{congruentAvgRT.toFixed(0)} ms</div>
          </div>
        )}

        {hasWordTrials && (
          <div className="result-card">
            <div className="result-label">不一致条件 平均RT</div>
            <div className="result-value">{incongruentAvgRT.toFixed(0)} ms</div>
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
        {participant.note && <> / {participant.note}</>}
      </div>

      <div className="export-buttons">
        <button className="btn-secondary" onClick={() => exportTrialsCSV(session)}>
          試行サマリー CSV
        </button>
        <button className="btn-secondary" onClick={() => exportMousePathCSV(session)}>
          マウス軌跡 CSV
        </button>
        <button className="btn-secondary" onClick={() => exportSessionJSON(session)}>
          全データ JSON
        </button>
      </div>

      <button className="btn-primary" onClick={onRestart}>
        新しいセッションを開始
      </button>
    </div>
  );
}
