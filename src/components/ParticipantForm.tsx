import { useState } from 'react';
import type { Participant, TestMode } from '../types';

interface Props {
  onSubmit: (participant: Participant, mode: TestMode) => void;
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

export function ParticipantForm({ onSubmit }: Props) {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Participant['gender']>('male');
  const [handedness, setHandedness] = useState<Participant['handedness']>('right');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<TestMode>('incongruent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const participant: Participant = {
      id: `P${Date.now()}`,
      age: Number(age),
      gender,
      handedness,
      note,
      createdAt: Date.now(),
    };
    onSubmit(participant, mode);
  };

  return (
    <div className="screen form-screen">
      <h1>ストループテスト</h1>
      <p className="description">
        画面に表示される文字の<strong>インクの色</strong>をボタンで選んでください。
      </p>

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
          <label>年齢</label>
          <input
            type="number"
            min={5}
            max={120}
            value={age}
            onChange={e => setAge(e.target.value)}
            required
            placeholder="例: 25"
          />
        </div>

        <div className="form-group">
          <label>性別</label>
          <div className="radio-group">
            {(['male', 'female', 'other'] as const).map(v => (
              <label key={v} className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value={v}
                  checked={gender === v}
                  onChange={() => setGender(v)}
                />
                {v === 'male' ? '男性' : v === 'female' ? '女性' : 'その他'}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>利き手</label>
          <div className="radio-group">
            {(['right', 'left'] as const).map(v => (
              <label key={v} className="radio-label">
                <input
                  type="radio"
                  name="handedness"
                  value={v}
                  checked={handedness === v}
                  onChange={() => setHandedness(v)}
                />
                {v === 'right' ? '右利き' : '左利き'}
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

        <button type="submit" className="btn-primary" disabled={!age}>
          テストを開始する
        </button>
      </form>
    </div>
  );
}
