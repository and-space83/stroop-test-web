import { useState } from 'react';
import type { TestMode } from '../types';
import { HistoryModal } from './HistoryModal';

interface Props {
  onStart: (mode: TestMode, note: string) => void;
  onSignOut: () => Promise<void>;
  participantLabel: string;
  participantId: string;
}

const MODE_OPTIONS: { value: TestMode; label: string; description: string }[] = [
  {
    value: 'color-naming',
    label: 'Color Naming',
    description: '色のついた丸を見て、その色の名前を答えます。',
  },
  {
    value: 'incongruent',
    label: 'Incongruent Color Naming',
    description: '色名の文字が別の色で表示されます。文字のインクの色を答えます。',
  },
  {
    value: 'both',
    label: 'Both（Color Naming → Incongruent）',
    description: 'Color Naming を行った後に続けて Incongruent Color Naming を行います。',
  },
];

export function ModeSelectScreen({
  onStart,
  onSignOut,
  participantLabel,
  participantId,
}: Props) {
  const [mode, setMode] = useState<TestMode>('incongruent');
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(mode, note);
  };

  return (
    <div className="screen form-screen">
      <div className="mode-select-header">
        <h1>セッション設定</h1>
        <div className="mode-select-actions">
          <button className="btn-signout" onClick={() => setShowHistory(true)}>
            過去の記録
          </button>
          <button className="btn-signout" onClick={onSignOut}>
            ログアウト
          </button>
        </div>
      </div>

      <div className="participant-badge">
        {participantLabel}
      </div>

      <form onSubmit={handleSubmit} className="participant-form">
        <div className="form-group">
          <label>テストモード</label>
          <div className="mode-group">
            {MODE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`mode-card ${mode === opt.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={opt.value}
                  checked={mode === opt.value}
                  onChange={() => setMode(opt.value)}
                />
                <div className="mode-card-body">
                  <div className="mode-card-title">{opt.label}</div>
                  <div className="mode-card-desc">{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>備考（任意）</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="例: 症例名・測定日など"
          />
        </div>

        <button type="submit" className="btn-primary">
          テストを開始する
        </button>
      </form>

      {showHistory && (
        <HistoryModal
          participantId={participantId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
